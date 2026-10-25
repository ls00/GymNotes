package com.gymnotes.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita broker simples para tópicos públicos e filas de usuário
        config.enableSimpleBroker("/topic", "/queue");
        // Prefixo para mensagens enviadas a partir dos clientes para controllers anotados com @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
        // Prefixo para mensagens direcionadas a usuários específicos
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket com fallback para SockJS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Endpoint WebSocket nativo puro
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}

