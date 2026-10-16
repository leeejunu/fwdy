package com.forward.controller;

import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@Slf4j
public class HealthController {

	@GetMapping
	public Map<String, String> health() {
		log.debug("GET /api/health completed: status=200");
		return Map.of("status", "ok");
	}
}
