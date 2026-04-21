package com.cj.twilio.callcenter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TwilioCallcenterServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TwilioCallcenterServerApplication.class, args);
	}

}
