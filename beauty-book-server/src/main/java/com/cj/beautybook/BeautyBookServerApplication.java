package com.cj.beautybook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class BeautyBookServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(BeautyBookServerApplication.class, args);
	}

}
