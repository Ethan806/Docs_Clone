package com.example.demo;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AccountService {

    private final accountRepository ar;
    private final PasswordEncoder passwordEncoder;

    

    public Account registerAccount(Account ac) {
        String email = ac.getEmail().trim().toLowerCase();



        if (!ar.findAllByEmailIgnoreCase(email).isEmpty()) {
            throw new IllegalStateException("An account with this email already exists");
        }

        ac.setId(null);
        ac.setEmail(email);

        // Encrypt password before saving
        ac.setPassword(passwordEncoder.encode(ac.getPassword()));

        return ar.save(ac);
    }

    public boolean checkPassword(Account ac) {

        return ar.findAllByEmailIgnoreCase(ac.getEmail()).stream()
                .map(Account::getPassword)
                .filter(password -> password != null && password.startsWith("$2"))
                .anyMatch(password -> passwordEncoder.matches(ac.getPassword(), password));
    }

    public Optional<Account> getAccountByEmail(String email) {
        List<Account> accounts = ar.findAllByEmailIgnoreCase(email);
        return accounts.stream()
                .filter(account -> account.getPassword() != null
                        && account.getPassword().startsWith("$2"))
                .findFirst();
    }

    public void changePassword(Account ac) {

        ac.setPassword(passwordEncoder.encode(ac.getPassword()));

        ar.save(ac);
    }

}
