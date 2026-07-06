package com.example.demo;

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

        ac.setId(null);

        // Encrypt password before saving
        ac.setPassword(passwordEncoder.encode(ac.getPassword()));

        return ar.save(ac);
    }

    public boolean checkPassword(Account ac) {

        Optional<Account> account = ar.findByEmailIgnoreCase(ac.getEmail());

        if (account.isEmpty()) {
            return false;
        }

        return passwordEncoder.matches(
                ac.getPassword(),
                account.get().getPassword());
    }

    public Optional<Account> getAccountByEmail(String email) {
        return ar.findByEmailIgnoreCase(email);
    }

    public void changePassword(Account ac) {

        ac.setPassword(passwordEncoder.encode(ac.getPassword()));

        ar.save(ac);
    }

}