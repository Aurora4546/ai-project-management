package com.projectmanagement.pmanage;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PmanageApplicationTests {

	@MockitoBean
	private ChatModel chatModel;

	@MockitoBean
	private ChatClient.Builder chatClientBuilder;

	@MockitoBean
	private JdbcTemplate jdbcTemplate;

	@Test
	void contextLoads() {
	}

}
