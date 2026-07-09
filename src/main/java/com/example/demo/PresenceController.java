package com.example.demo;

import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import com.example.demo.service.PresenceService;

import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    @MessageMapping("/presence/join")
    @SendTo("/topic/presence")
    public List<Viewer> join(@Payload Viewer viewer) {

        return presenceService.join(viewer);

    }

    @MessageMapping("/presence/leave")
    @SendTo("/topic/presence")
    public List<Viewer> leave(@Payload Viewer viewer) {

        return presenceService.leave(viewer);

    }

}