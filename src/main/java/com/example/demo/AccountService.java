package com.example.demo;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.AllArgsConstructor;
@Service
@AllArgsConstructor
public class AccountService {
    private final accountRepository ar;

    public Account registerAccount(Account ac) {
        ac.setId(null);
        return ar.save(ac);

    }

    public Boolean check_password(Account ac) {
        List<Account> ac_1 = ar.findByEmailIgnoreCase(ac.getEmail());
        if (ac_1.isEmpty()) {
            return false; // Email not found
        }
        Account ac_1_1 = ac_1.get(0);
        if (ac_1_1.getPassword().equals(ac.getPassword())) {
            return true;
        }
        return false;
    }

    public void change_password(Account ac) {
        ar.save(ac);
    }

}
