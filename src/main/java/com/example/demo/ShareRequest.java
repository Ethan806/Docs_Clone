package com.example.demo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShareRequest {
    private String documentId;
    private String email;
    private boolean canEdit;
    private boolean canRead;
}
