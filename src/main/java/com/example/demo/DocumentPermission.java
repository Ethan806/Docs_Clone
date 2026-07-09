package com.example.demo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentPermission {
    private String email;
    private boolean canread;
    private boolean canedit;
    private LocalDateTime lastOpenedAt;
}
