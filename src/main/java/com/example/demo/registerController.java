package com.example.demo;

import org.springframework.web.bind.annotation.*;

import com.example.demo.security.JwtUtil;

import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class registerController {

    private final AccountService as;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public Account register(@RequestBody Account ac) {
        return as.registerAccount(ac);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody Account ac) {

        boolean valid = as.checkPassword(ac);

        if (!valid) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(ac.getEmail());

        return new AuthResponse(token);
    }
}