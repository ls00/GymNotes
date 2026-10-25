package com.gymnotes.repository;

import com.gymnotes.domain.Food;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FoodRepository extends JpaRepository<Food, UUID> {

    @Query("SELECT f FROM Food f WHERE " +
           "LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(f.brand IS NOT NULL AND LOWER(f.brand) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Food> searchByNameOrBrand(@Param("query") String query, Pageable pageable);
}

