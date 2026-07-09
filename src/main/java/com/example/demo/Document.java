package com.example.demo;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import org.springframework.data.annotation.Id;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@org.springframework.data.mongodb.core.mapping.Document(collection = "documents")
@Getter
@Setter
public class Document {

    @Id
    private String id;

    @NotBlank(message = "Title is required")
    private String title;

    private List<DocumentPermission> sharedWith = new ArrayList<>();

    @NotBlank(message = "Content is required")
    private String content;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Owner email is required")
    private String ownerEmail;

    private LocalDateTime ownerLastOpenedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
