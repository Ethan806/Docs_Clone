package com.example.demo.service;

import java.util.Collections;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.Account;
import com.example.demo.AccountService;
import com.example.demo.accountRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final accountRepository repository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        Account account = repository
                .findAllByEmailIgnoreCase(email)
                .stream()
                .filter(candidate -> candidate.getPassword() != null
                        && candidate.getPassword().startsWith("$2"))
                .findFirst()
                .orElseThrow(() ->
                new UsernameNotFoundException("User not found"));

        return new User(
                account.getEmail(),
                account.getPassword(),
                Collections.emptyList());
    }
}
