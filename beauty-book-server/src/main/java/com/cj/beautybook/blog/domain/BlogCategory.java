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
@Table(name = "blog_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlogCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false)
    private int displayOrder = 0;

    public static BlogCategory create(String name, String slug, int displayOrder) {
        BlogCategory c = new BlogCategory();
        c.name = name;
        c.slug = slug;
        c.displayOrder = displayOrder;
        return c;
    }

    public void update(String name, String slug, int displayOrder) {
        this.name = name;
        this.slug = slug;
        this.displayOrder = displayOrder;
    }
}
