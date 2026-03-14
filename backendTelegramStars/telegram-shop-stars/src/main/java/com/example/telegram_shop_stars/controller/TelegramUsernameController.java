package com.example.telegram_shop_stars.controller;

import com.example.telegram_shop_stars.dto.UsernameCheckRequest;
import com.example.telegram_shop_stars.dto.UsernameCheckResponse;
import com.example.telegram_shop_stars.service.TelegramUsernameService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tg")
public class TelegramUsernameController {

    private final TelegramUsernameService service;

    public TelegramUsernameController(TelegramUsernameService service) {
        this.service = service;
    }

    @PostMapping("/username/check")
    public UsernameCheckResponse check(@Valid @RequestBody UsernameCheckRequest req) {
        return service.check(req.username());
    }
}
