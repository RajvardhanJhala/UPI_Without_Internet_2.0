package com.demo.upimesh.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Fans out mesh activity (injection, gossip, settlement outcomes) to any
 * connected frontend over Server-Sent Events, so a UI can animate the mesh
 * live instead of polling /api/mesh/state on a timer.
 */
@Service
public class MeshEventBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(MeshEventBroadcaster.class);

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // no timeout — client controls the connection lifetime
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    public void broadcast(String eventName, Map<String, Object> payload) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (Exception e) {
                // Emitter is dead (client disconnected, async context already
                // errored, etc). completeWithError() is safe to call even on
                // an already-terminated emitter, unlike complete() — this must
                // never propagate, or one stale SSE client would 500 every
                // future mesh action for every other caller.
                emitters.remove(emitter);
                try {
                    emitter.completeWithError(e);
                } catch (Exception ignored) {
                    // already terminated — nothing to do
                }
            }
        }
    }
}
