package com.example.demo.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.example.demo.Viewer;

@Service
public class PresenceService {

    private final Map<String, Map<String, Viewer>> viewers = new ConcurrentHashMap<>();

    public List<Viewer> join(Viewer viewer) {

        viewers
                .computeIfAbsent(viewer.getDocumentId(), k -> new ConcurrentHashMap<>())
                .put(viewer.getEmail(), viewer);

        return List.copyOf(
                viewers.get(viewer.getDocumentId()).values());
    }

    public List<Viewer> leave(Viewer viewer) {

        Map<String, Viewer> room = viewers.get(viewer.getDocumentId());

        if (room != null) {

            room.remove(viewer.getEmail());

            if (room.isEmpty()) {
                viewers.remove(viewer.getDocumentId());
            }
        }

        return room == null ? List.of() : List.copyOf(room.values());
    }

}