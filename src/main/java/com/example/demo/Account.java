package com.example.demo;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection="users")
@Getter
@Setter
public class Account {

    @Id
    private String id;

    @NotBlank(message="Email cannot be empty")
    @Email(message="Input a valid email")
    private String email;

    @NotBlank(message="password cannot be empty")
    private String password;

    
}
