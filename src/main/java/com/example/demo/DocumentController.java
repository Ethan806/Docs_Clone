package com.example.demo;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import lombok.AllArgsConstructor;

import java.util.Optional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@AllArgsConstructor
@RequestMapping("/api/document")
public class DocumentController {
    private final DocumentService ds;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/saveDoc")
    public Document saveDocument(@RequestBody Document entity) {
        
        return ds.createDocument(entity);
        
    }

    @GetMapping("/getDocument/{id}")
    public Optional<Document> getDocumentById(@PathVariable String id){
        return ds.getDocumentById(id);
    }

    @GetMapping("/getDocument")
    public List<Document> getAllDocument(@RequestParam(required = false) String ownerEmail){
        return ds.getDocumentByOwner(ownerEmail);
    }

    @GetMapping("/recent")
    public List<Document> getRecentDocuments(){
        return ds.getRecentDocuments();
    }

    @PostMapping("/openDocument/{id}")
    public Document openDocument(@PathVariable String id){
        return ds.openDocument(id);
    }

    @GetMapping("/sharedWith")
    public List<Document> getSharedWithMe(@RequestParam String email){
        return ds.getDocumentsSharedWith(email);
    }
    @MessageMapping("/document/update")
    public void update(DocumentUpdate update) {

    messagingTemplate.convertAndSend(
            "/topic/document/" + update.getDocumentId(),
            update
    );

}
    

    @PutMapping("/updateDoc")
    public Document updateDoc(@RequestBody Document entity) {
        return ds.updateDocument(entity);
    }

    @DeleteMapping("/deleteDoc/{id}")
    public void deleteDoc(@PathVariable String id){
        ds.deleteDocument(id);
    }

    @PostMapping("/share")
    public Document shareDocument(@RequestBody ShareRequest req){
       
        return ds.shareDocument(req);

    }

    
    
    
}
