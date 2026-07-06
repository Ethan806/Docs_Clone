package com.example.demo;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface accountRepository extends MongoRepository<Account, String> {

    Optional<Account> findByEmailIgnoreCase(String email);

}