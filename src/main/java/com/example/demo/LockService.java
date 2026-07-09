package com.example.demo;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class LockService {

    private final ConcurrentHashMap<String, DocumentLock> locks = new ConcurrentHashMap<>();

    public DocumentLock lock(DocumentLock request) {

        DocumentLock currentLock = locks.get(request.getDocumentId());

        if (currentLock == null) {

            locks.put(request.getDocumentId(), request);

            return request;
        }

        return currentLock;
    }

    public DocumentLock unlock(DocumentLock request) {

        DocumentLock currentLock = locks.get(request.getDocumentId());

        if (currentLock != null &&
                currentLock.getEmail().equalsIgnoreCase(request.getEmail())) {

            locks.remove(request.getDocumentId());

            DocumentLock unlocked = new DocumentLock();
            unlocked.setDocumentId(request.getDocumentId());
            unlocked.setEmail(null);

            return unlocked;
        }

        return currentLock;
    }

    public DocumentLock getLock(String documentId) {

        return locks.get(documentId);
    }

}