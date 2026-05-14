package com.projectmanagement.pmanage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PmanageApplication {

	private static final Logger log = LoggerFactory.getLogger(PmanageApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(PmanageApplication.class, args);
	}

	@Bean
	@org.springframework.context.annotation.Profile("!test")
	CommandLineRunner dropRoleColumn(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				jdbcTemplate.execute("ALTER TABLE users DROP COLUMN role;");
				log.info("Successfully dropped obsolete 'role' column from 'users' table.");
			} catch (Exception e) {
				log.info("'role' column likely already dropped or another error occurred: {}", e.getMessage());
			}
		};
	}
}
