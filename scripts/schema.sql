-- Mirqas Perfumes Database Schema for MySQL 8.0+
-- Database: mirqasperfumes_db

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(20) NOT NULL DEFAULT '',
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `isOwner` TINYINT(1) NOT NULL DEFAULT 0,
  `canManageAdmins` TINYINT(1) NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `emailVerified` TINYINT(1) NOT NULL DEFAULT 0,
  `phoneVerified` TINYINT(1) NOT NULL DEFAULT 0,
  `resetTokenHash` VARCHAR(64) NULL DEFAULT NULL,
  `resetTokenExpiry` DATETIME(3) NULL DEFAULT NULL,
  `phoneOtpHash` VARCHAR(64) NULL DEFAULT NULL,
  `phoneOtpExpiry` DATETIME(3) NULL DEFAULT NULL,
  `phoneOtpAttempts` INT NOT NULL DEFAULT 0,
  `verificationTokenHash` VARCHAR(64) NULL DEFAULT NULL,
  `verificationTokenExpiry` DATETIME(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_sessions_token_hash` (`tokenHash`),
  KEY `idx_sessions_user_id` (`userId`),
  KEY `idx_sessions_expires_at` (`expiresAt`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(80) NOT NULL DEFAULT 'Mirqas',
  `description` TEXT,
  `price` INT NOT NULL,
  `salePrice` INT DEFAULT NULL,
  `category` VARCHAR(80) NOT NULL,
  `images` JSON NOT NULL,
  `video` VARCHAR(255) NOT NULL DEFAULT '',
  `stock` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `isBestSeller` TINYINT(1) NOT NULL DEFAULT 0,
  `gender` ENUM('Men', 'Women', 'Unisex') NOT NULL DEFAULT 'Unisex',
  `occasion` JSON NOT NULL,
  `family` VARCHAR(80) NOT NULL DEFAULT '',
  `notes` JSON NOT NULL,
  `badge` VARCHAR(40) NOT NULL DEFAULT '',
  `isFeatured` TINYINT(1) NOT NULL DEFAULT 0,
  `sales` INT NOT NULL DEFAULT 0,
  `sections` JSON NOT NULL,
  `collections` JSON NOT NULL,
  `showInNewArrivals` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_products_slug` (`slug`),
  KEY `idx_products_category` (`category`),
  KEY `idx_products_gender` (`gender`),
  KEY `idx_products_is_active` (`isActive`),
  KEY `idx_products_is_best_seller` (`isBestSeller`),
  KEY `idx_products_created_at` (`createdAt`),
  KEY `idx_products_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL,
  `orderNumber` VARCHAR(30) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `subtotal` INT NOT NULL,
  `shippingFee` INT NOT NULL DEFAULT 0,
  `total` INT NOT NULL,
  `status` ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  `paymentMethod` ENUM('cod', 'razorpay') NOT NULL DEFAULT 'cod',
  `paymentStatus` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `razorpayOrderId` VARCHAR(100) NOT NULL DEFAULT '',
  `razorpayPaymentId` VARCHAR(100) NOT NULL DEFAULT '',
  `shippingName` VARCHAR(100) NOT NULL,
  `shippingPhone` VARCHAR(20) NOT NULL,
  `shippingLine1` VARCHAR(200) NOT NULL,
  `shippingLine2` VARCHAR(200) NOT NULL DEFAULT '',
  `shippingCity` VARCHAR(80) NOT NULL,
  `shippingState` VARCHAR(80) NOT NULL,
  `shippingPincode` VARCHAR(10) NOT NULL,
  `note` TEXT,
  `idempotencyKey` VARCHAR(64) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_orders_order_number` (`orderNumber`),
  KEY `idx_orders_user_id` (`userId`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`createdAt`),
  UNIQUE KEY `idx_orders_user_idempotency` (`userId`, `idempotencyKey`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(36) NOT NULL,
  `orderId` VARCHAR(36) NOT NULL,
  `productId` VARCHAR(36) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `image` VARCHAR(255) NOT NULL DEFAULT '',
  `ml` INT NOT NULL,
  `qty` INT NOT NULL,
  `unitPrice` INT NOT NULL,
  `lineTotal` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`orderId`),
  KEY `idx_order_items_product_id` (`productId`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` VARCHAR(36) NOT NULL,
  `orderId` VARCHAR(36) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') NOT NULL,
  `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_order_status_history_order_id` (`orderId`),
  CONSTRAINT `fk_order_status_history_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(36) NOT NULL,
  `productId` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `userName` VARCHAR(80) NOT NULL,
  `rating` TINYINT NOT NULL,
  `title` VARCHAR(100) NOT NULL DEFAULT '',
  `comment` TEXT NOT NULL,
  `images` JSON NOT NULL,
  `video` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('published', 'hidden') NOT NULL DEFAULT 'published',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reviews_product_user` (`productId`, `userId`),
  KEY `idx_reviews_product_status` (`productId`, `status`),
  KEY `idx_reviews_user_id` (`userId`),
  KEY `idx_reviews_created_at` (`createdAt`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `line1` VARCHAR(200) NOT NULL,
  `line2` VARCHAR(200) NOT NULL DEFAULT '',
  `city` VARCHAR(80) NOT NULL,
  `state` VARCHAR(80) NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_addresses_user_id` (`userId`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `carts` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_carts_user_id` (`userId`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` VARCHAR(36) NOT NULL,
  `cartId` VARCHAR(36) NOT NULL,
  `productId` VARCHAR(36) NOT NULL,
  `ml` INT NOT NULL,
  `qty` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cart_items_cart_product_ml` (`cartId`, `productId`, `ml`),
  KEY `idx_cart_items_product_id` (`productId`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cartId`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlists` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_wishlists_user_id` (`userId`),
  CONSTRAINT `fk_wishlists_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `id` VARCHAR(36) NOT NULL,
  `wishlistId` VARCHAR(36) NOT NULL,
  `productId` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_wishlist_items_wishlist_product` (`wishlistId`, `productId`),
  KEY `idx_wishlist_items_product_id` (`productId`),
  CONSTRAINT `fk_wishlist_items_wishlist` FOREIGN KEY (`wishlistId`) REFERENCES `wishlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_items_product` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_uploads` (
  `name` VARCHAR(64) NOT NULL,
  `mimeType` VARCHAR(64) NOT NULL,
  `data` LONGBLOB NOT NULL,
  `size` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_chunks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `uploadId` VARCHAR(64) NOT NULL,
  `chunkIndex` INT NOT NULL,
  `data` MEDIUMBLOB NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_chunks_upload_chunk` (`uploadId`, `chunkIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
