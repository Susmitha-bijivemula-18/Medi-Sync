package com.caretrack.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class QueueNotificationService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter() {
        // 5 minute timeout for SSE stream
        SseEmitter emitter = new SseEmitter(300_000L);

        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(emitter);
        });
        emitter.onError((e) -> {
            emitter.complete();
            emitters.remove(emitter);
        });

        // Send initial connection handshake
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"status\":\"connected\",\"message\":\"MediSync Live Queue SSE Connected\"}"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcastQueueUpdate(String eventName, Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(data));
            } catch (Exception e) {
                emitter.complete();
                emitters.remove(emitter);
            }
        }
    }
}
