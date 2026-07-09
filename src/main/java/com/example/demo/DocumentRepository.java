package com.example.demo;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface DocumentRepository extends MongoRepository<Document, String> {
    List<Document> findByOwnerEmail(String ownerEmail);
    List<Document> findBySharedWithEmailIgnoreCase(String email);
}