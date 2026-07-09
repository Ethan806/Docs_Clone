package com.example.demo;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;

import org.springframework.stereotype.Controller;

import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class LockController {

    private final LockService lockService;

    @MessageMapping("/lock")
    @SendTo("/topic/lock")
    public DocumentLock lock(@Payload DocumentLock lock) {

        return lockService.lock(lock);

    }

    @MessageMapping("/unlock")
    @SendTo("/topic/lock")
    public DocumentLock unlock(@Payload DocumentLock lock) {

        return lockService.unlock(lock);

    }

}