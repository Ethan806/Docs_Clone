package com.example.demo;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class DocumentService {
    private final DocumentRepository dr;
    private final accountRepository ar;

    public Document createDocument(Document document) {
        document.setId(null);
        document.setOwnerEmail(getLoggedInUser());
        LocalDateTime now = LocalDateTime.now();
        document.setCreatedAt(now);
        document.setUpdatedAt(now);
        document.setOwnerLastOpenedAt(now);
        return dr.save(document);
    }

    public Optional<Document> getDocumentById(String id) {
        String loggedInUser = getLoggedInUser();

        return dr.findById(id)
                .filter(doc -> hasReadPermission(doc, loggedInUser));
    }

    public Document openDocument(String id) {
        String loggedInUser = getLoggedInUser();
        Document doc = dr.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (!hasReadPermission(doc, loggedInUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this document");
        }

        markOpenedBy(doc, loggedInUser);
        return dr.save(doc);
    }

    public List<Document> getRecentDocuments() {
        String loggedInUser = getLoggedInUser();

        return dr.findAll().stream()
                .filter(doc -> isRecentForUser(doc, loggedInUser))
                .sorted(Comparator.comparing(
                        doc -> lastOpenedForUser(doc, loggedInUser),
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public Document shareDocument(ShareRequest req) {

        // Check whether the user exists
        Account account = ar.findAllByEmailIgnoreCase(req.getEmail())
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Document doc = dr.findById(req.getDocumentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        String loggedInUser = getLoggedInUser();

        if (!doc.getOwnerEmail().equalsIgnoreCase(loggedInUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner can share");
        }

        if (account.getEmail().equalsIgnoreCase(doc.getOwnerEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner already has access");
        }

        DocumentPermission permission = sharedWith(doc).stream()
                .filter(p -> sameEmail(p.getEmail(), account.getEmail()))
                .findFirst()
                .orElseGet(() -> {
                    DocumentPermission newPermission = new DocumentPermission();
                    newPermission.setEmail(account.getEmail());
                    doc.getSharedWith().add(newPermission);
                    return newPermission;
                });

        permission.setCanedit(req.isCanEdit());
        permission.setCanread(req.isCanRead());

        doc.setUpdatedAt(LocalDateTime.now());

        return dr.save(doc);
    }

    public List<Document> getDocumentByOwner(String owner) {
        String loggedInUser = getLoggedInUser();

        if (owner == null || owner.isBlank()) {
            return dr.findByOwnerEmail(loggedInUser);
        }

        if (!owner.equalsIgnoreCase(loggedInUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view another user's documents");
        }

        return dr.findByOwnerEmail(owner);
    }

    public Document updateDocument(Document d) {
        if (d.getId() == null || d.getId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document id is required");
        }

        Document existing = dr.findById(d.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (!hasEditPermission(existing, getLoggedInUser())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You only have read permission for this document");
        }

        existing.setTitle(d.getTitle());
        existing.setContent(d.getContent());
        existing.setUpdatedAt(LocalDateTime.now());

        return dr.save(existing);
    }

    public void deleteDocument(String id) {
        Document existing = dr.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (!existing.getOwnerEmail().equalsIgnoreCase(getLoggedInUser())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner can delete");
        }

        dr.deleteById(id);
    }

    public List<Document> getDocumentsSharedWith(String email) {
        String loggedInUser = getLoggedInUser();

        if (!email.equalsIgnoreCase(loggedInUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view another user's shared documents");
        }

        return dr.findAll().stream()
                .filter(doc -> sharedWith(doc).stream()
                        .anyMatch(p -> sameEmail(p.getEmail(), email) && (p.isCanread() || p.isCanedit())))
                .toList();
    }

    private String getLoggedInUser() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }

    private boolean hasReadPermission(Document doc, String email) {
        return sameEmail(doc.getOwnerEmail(), email)
                || sharedWith(doc).stream()
                        .anyMatch(p -> sameEmail(p.getEmail(), email) && (p.isCanread() || p.isCanedit()));
    }

    private boolean isRecentForUser(Document doc, String email) {
        if (sameEmail(doc.getOwnerEmail(), email)) {
            return true;
        }

        return sharedWith(doc).stream()
                .anyMatch(p -> sameEmail(p.getEmail(), email)
                        && (p.isCanread() || p.isCanedit())
                        && p.getLastOpenedAt() != null);
    }

    private LocalDateTime lastOpenedForUser(Document doc, String email) {
        if (sameEmail(doc.getOwnerEmail(), email)) {
            if (doc.getOwnerLastOpenedAt() != null) {
                return doc.getOwnerLastOpenedAt();
            }

            return doc.getUpdatedAt() != null ? doc.getUpdatedAt() : doc.getCreatedAt();
        }

        return sharedWith(doc).stream()
                .filter(p -> sameEmail(p.getEmail(), email))
                .map(DocumentPermission::getLastOpenedAt)
                .findFirst()
                .orElse(null);
    }

    private void markOpenedBy(Document doc, String email) {
        LocalDateTime now = LocalDateTime.now();

        if (sameEmail(doc.getOwnerEmail(), email)) {
            doc.setOwnerLastOpenedAt(now);
            return;
        }

        sharedWith(doc).stream()
                .filter(p -> sameEmail(p.getEmail(), email))
                .findFirst()
                .ifPresent(permission -> permission.setLastOpenedAt(now));
    }

    private boolean hasEditPermission(Document doc, String email) {
        return sameEmail(doc.getOwnerEmail(), email)
                || sharedWith(doc).stream()
                        .anyMatch(p -> sameEmail(p.getEmail(), email) && p.isCanedit());
    }

    private List<DocumentPermission> sharedWith(Document doc) {
        return doc.getSharedWith() == null ? List.of() : doc.getSharedWith();
    }

    private boolean sameEmail(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }
}
