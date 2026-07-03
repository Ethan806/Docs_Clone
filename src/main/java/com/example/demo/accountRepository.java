package com.example.demo;


import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface accountRepository extends MongoRepository<Account,String>{
    public List<Account> findByEmailIgnoreCase(String email);
}
