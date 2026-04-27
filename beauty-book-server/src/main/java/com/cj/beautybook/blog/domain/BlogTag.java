package com.cj.beautybook.blog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blog_tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlogTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    public static BlogTag create(String name, String slug) {
        BlogTag tag = new BlogTag();
        tag.name = name;
        tag.slug = slug;
        return tag;
    }
}
