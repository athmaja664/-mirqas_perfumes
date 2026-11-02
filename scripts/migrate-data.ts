import { randomUUID } from "node:crypto";
import { Sequelize, QueryTypes } from "sequelize";

async function main() {
  let mongoose: any;
  try {
    // Dynamic import to allow application to build and run without mongoose dependency
    // @ts-ignore
    const imported = await import("mongoose");
    mongoose = imported.default || imported;
  } catch {
    throw new Error(
      "To run data migration, please temporarily install mongoose: `npm install mongoose` and retry."
    );
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set");

  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const database = process.env.DB_NAME || "mirqas";
  const username = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const useSSL = process.env.DB_SSL === "true" || host.includes("tidbcloud.com");

  console.log("=== STARTING MONGODB TO MYSQL DATA MIGRATION ===");
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  const mongoDb = mongoose.connection.db;
  if (!mongoDb) throw new Error("Could not connect to MongoDB database.");
  console.log("Connected to MongoDB successfully!");

  console.log(`Connecting to MySQL on ${host}:${port}/${database}...`);
  const mysql = new Sequelize(database, username, password, {
    host,
    port,
    dialect: "mysql",
    logging: false,
    dialectOptions: useSSL ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {},
  });
  await mysql.authenticate();
  console.log("Connected to MySQL successfully!");

  const stats = {
    users: { read: 0, written: 0 },
    sessions: { read: 0, written: 0 },
    products: { read: 0, written: 0 },
    orders: { read: 0, written: 0 },
    order_items: { written: 0 },
    order_status_history: { written: 0 },
    reviews: { read: 0, written: 0 },
    addresses: { read: 0, written: 0 },
    carts: { read: 0, written: 0 },
    cart_items: { written: 0 },
    wishlists: { read: 0, written: 0 },
    wishlist_items: { written: 0 },
  };

  // 1. Migrate USERS
  console.log("\nMigrating users...");
  const mongoUsers = await mongoDb.collection("users").find({}).toArray();
  stats.users.read = mongoUsers.length;
  for (const u of mongoUsers) {
    try {
      await mysql.query(
        `INSERT INTO users (id, name, email, phone, passwordHash, role, isOwner, canManageAdmins, isActive, createdAt, updatedAt)
         VALUES (:id, :name, :email, :phone, :passwordHash, :role, :isOwner, :canManageAdmins, :isActive, :createdAt, :updatedAt)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), phone = VALUES(phone), passwordHash = VALUES(passwordHash),
           role = VALUES(role), isOwner = VALUES(isOwner), canManageAdmins = VALUES(canManageAdmins),
           isActive = VALUES(isActive), updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(u._id),
            name: u.name || "",
            email: String(u.email || "").toLowerCase().trim(),
            phone: u.phone || "",
            passwordHash: u.passwordHash || "",
            role: u.role === "admin" ? "admin" : "customer",
            isOwner: u.isOwner ? 1 : 0,
            canManageAdmins: u.canManageAdmins ? 1 : 0,
            isActive: u.isActive !== false ? 1 : 0,
            createdAt: new Date(u.createdAt || Date.now()),
            updatedAt: new Date(u.updatedAt || u.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.users.written++;
    } catch (err) {
      console.error(`Failed to migrate user ${u._id} (${u.email}):`, err);
    }
  }
  console.log(`Users migrated: ${stats.users.written} / ${stats.users.read}`);

  // 2. Migrate PRODUCTS
  console.log("\nMigrating products...");
  const mongoProducts = await mongoDb.collection("products").find({}).toArray();
  stats.products.read = mongoProducts.length;
  for (const p of mongoProducts) {
    try {
      await mysql.query(
        `INSERT INTO products (
          id, name, slug, brand, description, price, salePrice, category,
          images, video, stock, isActive, isBestSeller, gender, occasion,
          family, notes, badge, isFeatured, sales, sections, collections,
          showInNewArrivals, createdAt, updatedAt
        ) VALUES (
          :id, :name, :slug, :brand, :description, :price, :salePrice, :category,
          :images, :video, :stock, :isActive, :isBestSeller, :gender, :occasion,
          :family, :notes, :badge, :isFeatured, :sales, :sections, :collections,
          :showInNewArrivals, :createdAt, :updatedAt
        ) ON DUPLICATE KEY UPDATE
          name = VALUES(name), brand = VALUES(brand), description = VALUES(description),
          price = VALUES(price), salePrice = VALUES(salePrice), category = VALUES(category),
          images = VALUES(images), video = VALUES(video), stock = VALUES(stock),
          isActive = VALUES(isActive), isBestSeller = VALUES(isBestSeller), gender = VALUES(gender),
          occasion = VALUES(occasion), family = VALUES(family), notes = VALUES(notes),
          badge = VALUES(badge), isFeatured = VALUES(isFeatured), sales = VALUES(sales),
          sections = VALUES(sections), collections = VALUES(collections),
          showInNewArrivals = VALUES(showInNewArrivals), updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(p._id),
            name: p.name || "",
            slug: p.slug || "",
            brand: p.brand || "Mirqas",
            description: p.description || "",
            price: Number(p.price) || 0,
            salePrice: p.salePrice != null ? Number(p.salePrice) : null,
            category: p.category || "Uncategorized",
            images: JSON.stringify(Array.isArray(p.images) ? p.images : []),
            video: p.video || "",
            stock: Number(p.stock) || 0,
            isActive: p.isActive !== false ? 1 : 0,
            isBestSeller: p.isBestSeller ? 1 : 0,
            gender: ["Men", "Women", "Unisex"].includes(p.gender) ? p.gender : "Unisex",
            occasion: JSON.stringify(Array.isArray(p.occasion) ? p.occasion : []),
            family: p.family || "",
            notes: JSON.stringify(Array.isArray(p.notes) ? p.notes : []),
            badge: p.badge || "",
            isFeatured: p.isFeatured ? 1 : 0,
            sales: Number(p.sales) || 0,
            sections: JSON.stringify(Array.isArray(p.sections) ? p.sections : ["shop-all"]),
            collections: JSON.stringify(Array.isArray(p.collections) ? p.collections : []),
            showInNewArrivals: p.showInNewArrivals !== false ? 1 : 0,
            createdAt: new Date(p.createdAt || Date.now()),
            updatedAt: new Date(p.updatedAt || p.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.products.written++;
    } catch (err) {
      console.error(`Failed to migrate product ${p._id} (${p.slug}):`, err);
    }
  }
  console.log(`Products migrated: ${stats.products.written} / ${stats.products.read}`);

  // 3. Migrate SESSIONS
  console.log("\nMigrating sessions...");
  const mongoSessions = await mongoDb.collection("sessions").find({}).toArray();
  stats.sessions.read = mongoSessions.length;
  // Valid user IDs map
  const userIds = new Set(mongoUsers.map((u: any) => String(u._id)));
  for (const s of mongoSessions) {
    if (!userIds.has(String(s.userId))) continue;
    try {
      await mysql.query(
        `INSERT INTO sessions (id, userId, tokenHash, expiresAt, createdAt, updatedAt)
         VALUES (:id, :userId, :tokenHash, :expiresAt, :createdAt, :updatedAt)
         ON DUPLICATE KEY UPDATE expiresAt = VALUES(expiresAt), updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(s._id),
            userId: String(s.userId),
            tokenHash: s.tokenHash,
            expiresAt: new Date(s.expiresAt),
            createdAt: new Date(s.createdAt || Date.now()),
            updatedAt: new Date(s.updatedAt || s.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.sessions.written++;
    } catch (err) {
      console.error(`Failed to migrate session ${s._id}:`, err);
    }
  }
  console.log(`Sessions migrated: ${stats.sessions.written} / ${stats.sessions.read}`);

  // 4. Migrate ORDERS & Child tables
  console.log("\nMigrating orders, items, and status history...");
  const mongoOrders = await mongoDb.collection("orders").find({}).toArray();
  stats.orders.read = mongoOrders.length;
  for (const o of mongoOrders) {
    if (!userIds.has(String(o.userId))) {
      console.warn(`Skipping order ${o._id}: user ${o.userId} does not exist`);
      continue;
    }
    try {
      await mysql.query(
        `INSERT INTO orders (
          id, orderNumber, userId, subtotal, shippingFee, total, status,
          paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId,
          shippingName, shippingPhone, shippingLine1, shippingLine2, shippingCity,
          shippingState, shippingPincode, note, idempotencyKey, createdAt, updatedAt
        ) VALUES (
          :id, :orderNumber, :userId, :subtotal, :shippingFee, :total, :status,
          :paymentMethod, :paymentStatus, :razorpayOrderId, :razorpayPaymentId,
          :shippingName, :shippingPhone, :shippingLine1, :shippingLine2, :shippingCity,
          :shippingState, :shippingPincode, :note, :idempotencyKey, :createdAt, :updatedAt
        ) ON DUPLICATE KEY UPDATE
          status = VALUES(status), paymentStatus = VALUES(paymentStatus), updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(o._id),
            orderNumber: o.orderNumber,
            userId: String(o.userId),
            subtotal: Number(o.subtotal) || 0,
            shippingFee: Number(o.shippingFee) || 0,
            total: Number(o.total) || 0,
            status: o.status || "pending",
            paymentMethod: o.payment?.method || "cod",
            paymentStatus: o.payment?.status || "pending",
            razorpayOrderId: o.payment?.razorpayOrderId || "",
            razorpayPaymentId: o.payment?.razorpayPaymentId || "",
            shippingName: o.shipping?.name || "",
            shippingPhone: o.shipping?.phone || "",
            shippingLine1: o.shipping?.line1 || "",
            shippingLine2: o.shipping?.line2 || "",
            shippingCity: o.shipping?.city || "",
            shippingState: o.shipping?.state || "",
            shippingPincode: o.shipping?.pincode || "",
            note: o.note || "",
            idempotencyKey: o.idempotencyKey || null,
            createdAt: new Date(o.createdAt || Date.now()),
            updatedAt: new Date(o.updatedAt || o.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.orders.written++;

      // Delete existing order_items and statusHistory for idempotency
      await mysql.query("DELETE FROM order_items WHERE orderId = :orderId", {
        replacements: { orderId: String(o._id) },
        type: QueryTypes.DELETE,
      });
      await mysql.query("DELETE FROM order_status_history WHERE orderId = :orderId", {
        replacements: { orderId: String(o._id) },
        type: QueryTypes.DELETE,
      });

      // Insert order items
      if (Array.isArray(o.items)) {
        for (let i = 0; i < o.items.length; i++) {
          const item = o.items[i];
          const itemId = `${String(o._id)}-item-${i}`;
          await mysql.query(
            `INSERT INTO order_items (id, orderId, productId, slug, name, image, ml, qty, unitPrice, lineTotal, createdAt)
             VALUES (:id, :orderId, :productId, :slug, :name, :image, :ml, :qty, :unitPrice, :lineTotal, :createdAt)`,
            {
              replacements: {
                id: itemId,
                orderId: String(o._id),
                productId: String(item.productId),
                slug: item.slug || "",
                name: item.name || "",
                image: item.image || "",
                ml: Number(item.ml) || 0,
                qty: Number(item.qty) || 1,
                unitPrice: Number(item.unitPrice) || 0,
                lineTotal: Number(item.lineTotal) || 0,
                createdAt: new Date(o.createdAt || Date.now()),
              },
              type: QueryTypes.INSERT,
            }
          );
          stats.order_items.written++;
        }
      }

      // Insert order status history
      if (Array.isArray(o.statusHistory) && o.statusHistory.length > 0) {
        for (let j = 0; j < o.statusHistory.length; j++) {
          const step = o.statusHistory[j];
          await mysql.query(
            `INSERT INTO order_status_history (id, orderId, status, at)
             VALUES (:id, :orderId, :status, :at)`,
            {
              replacements: {
                id: `${String(o._id)}-step-${j}`,
                orderId: String(o._id),
                status: step.status,
                at: new Date(step.at || o.createdAt || Date.now()),
              },
              type: QueryTypes.INSERT,
            }
          );
          stats.order_status_history.written++;
        }
      } else {
        // Fallback default status history
        await mysql.query(
          `INSERT INTO order_status_history (id, orderId, status, at)
           VALUES (:id, :orderId, :status, :at)`,
          {
            replacements: {
              id: `${String(o._id)}-step-0`,
              orderId: String(o._id),
              status: o.status || "pending",
              at: new Date(o.createdAt || Date.now()),
            },
            type: QueryTypes.INSERT,
          }
        );
        stats.order_status_history.written++;
      }
    } catch (err) {
      console.error(`Failed to migrate order ${o._id}:`, err);
    }
  }
  console.log(`Orders migrated: ${stats.orders.written} / ${stats.orders.read}`);
  console.log(`Order items migrated: ${stats.order_items.written}`);
  console.log(`Order status history entries migrated: ${stats.order_status_history.written}`);

  // 5. Migrate REVIEWS
  console.log("\nMigrating reviews...");
  const mongoReviews = await mongoDb.collection("reviews").find({}).toArray();
  stats.reviews.read = mongoReviews.length;
  for (const r of mongoReviews) {
    if (!userIds.has(String(r.user))) {
      console.warn(`Skipping review ${r._id}: user ${r.user} does not exist`);
      continue;
    }
    try {
      await mysql.query(
        `INSERT INTO reviews (
          id, productId, userId, userName, rating, title, comment, images, video, status, createdAt, updatedAt
        ) VALUES (
          :id, :productId, :userId, :userName, :rating, :title, :comment, :images, :video, :status, :createdAt, :updatedAt
        ) ON DUPLICATE KEY UPDATE
          rating = VALUES(rating), title = VALUES(title), comment = VALUES(comment),
          images = VALUES(images), video = VALUES(video), status = VALUES(status), updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(r._id),
            productId: String(r.product),
            userId: String(r.user),
            userName: r.userName || "Customer",
            rating: Number(r.rating) || 5,
            title: r.title || "",
            comment: r.comment || "",
            images: JSON.stringify(Array.isArray(r.images) ? r.images : []),
            video: r.video || "",
            status: r.status === "hidden" ? "hidden" : "published",
            createdAt: new Date(r.createdAt || Date.now()),
            updatedAt: new Date(r.updatedAt || r.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.reviews.written++;
    } catch (err) {
      console.error(`Failed to migrate review ${r._id}:`, err);
    }
  }
  console.log(`Reviews migrated: ${stats.reviews.written} / ${stats.reviews.read}`);

  // 6. Migrate ADDRESSES
  console.log("\nMigrating addresses...");
  const mongoAddresses = await mongoDb.collection("addresses").find({}).toArray();
  stats.addresses.read = mongoAddresses.length;
  for (const a of mongoAddresses) {
    if (!userIds.has(String(a.userId))) continue;
    try {
      await mysql.query(
        `INSERT INTO addresses (id, userId, name, phone, line1, line2, city, state, pincode, createdAt, updatedAt)
         VALUES (:id, :userId, :name, :phone, :line1, :line2, :city, :state, :pincode, :createdAt, :updatedAt)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), phone = VALUES(phone), line1 = VALUES(line1), line2 = VALUES(line2),
           city = VALUES(city), state = VALUES(state), pincode = VALUES(pincode), updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(a._id),
            userId: String(a.userId),
            name: a.name || "",
            phone: a.phone || "",
            line1: a.line1 || "",
            line2: a.line2 || "",
            city: a.city || "",
            state: a.state || "",
            pincode: a.pincode || "",
            createdAt: new Date(a.createdAt || Date.now()),
            updatedAt: new Date(a.updatedAt || a.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.addresses.written++;
    } catch (err) {
      console.error(`Failed to migrate address ${a._id}:`, err);
    }
  }
  console.log(`Addresses migrated: ${stats.addresses.written} / ${stats.addresses.read}`);

  // 7. Migrate CARTS
  console.log("\nMigrating carts...");
  const mongoCarts = await mongoDb.collection("carts").find({}).toArray();
  stats.carts.read = mongoCarts.length;
  for (const c of mongoCarts) {
    if (!userIds.has(String(c.userId))) continue;
    try {
      await mysql.query(
        `INSERT INTO carts (id, userId, createdAt, updatedAt)
         VALUES (:id, :userId, :createdAt, :updatedAt)
         ON DUPLICATE KEY UPDATE updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(c._id),
            userId: String(c.userId),
            createdAt: new Date(c.createdAt || Date.now()),
            updatedAt: new Date(c.updatedAt || c.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.carts.written++;

      await mysql.query("DELETE FROM cart_items WHERE cartId = :cartId", {
        replacements: { cartId: String(c._id) },
        type: QueryTypes.DELETE,
      });

      if (Array.isArray(c.items)) {
        for (const item of c.items) {
          await mysql.query(
            `INSERT INTO cart_items (id, cartId, productId, ml, qty, createdAt, updatedAt)
             VALUES (:id, :cartId, :productId, :ml, :qty, :createdAt, :updatedAt)`,
            {
              replacements: {
                id: randomUUID(),
                cartId: String(c._id),
                productId: String(item.productId),
                ml: Number(item.ml) || 0,
                qty: Number(item.qty) || 1,
                createdAt: new Date(c.createdAt || Date.now()),
                updatedAt: new Date(c.updatedAt || c.createdAt || Date.now()),
              },
              type: QueryTypes.INSERT,
            }
          );
          stats.cart_items.written++;
        }
      }
    } catch (err) {
      console.error(`Failed to migrate cart ${c._id}:`, err);
    }
  }
  console.log(`Carts migrated: ${stats.carts.written} / ${stats.carts.read}`);

  // 8. Migrate WISHLISTS
  console.log("\nMigrating wishlists...");
  const mongoWishlists = await mongoDb.collection("wishlists").find({}).toArray();
  stats.wishlists.read = mongoWishlists.length;
  for (const w of mongoWishlists) {
    if (!userIds.has(String(w.userId))) continue;
    try {
      await mysql.query(
        `INSERT INTO wishlists (id, userId, createdAt, updatedAt)
         VALUES (:id, :userId, :createdAt, :updatedAt)
         ON DUPLICATE KEY UPDATE updatedAt = VALUES(updatedAt)`,
        {
          replacements: {
            id: String(w._id),
            userId: String(w.userId),
            createdAt: new Date(w.createdAt || Date.now()),
            updatedAt: new Date(w.updatedAt || w.createdAt || Date.now()),
          },
          type: QueryTypes.INSERT,
        }
      );
      stats.wishlists.written++;

      await mysql.query("DELETE FROM wishlist_items WHERE wishlistId = :wishlistId", {
        replacements: { wishlistId: String(w._id) },
        type: QueryTypes.DELETE,
      });

      if (Array.isArray(w.productIds)) {
        for (const pid of w.productIds) {
          await mysql.query(
            `INSERT INTO wishlist_items (id, wishlistId, productId, createdAt)
             VALUES (:id, :wishlistId, :productId, :createdAt)`,
            {
              replacements: {
                id: randomUUID(),
                wishlistId: String(w._id),
                productId: String(pid),
                createdAt: new Date(w.createdAt || Date.now()),
              },
              type: QueryTypes.INSERT,
            }
          );
          stats.wishlist_items.written++;
        }
      }
    } catch (err) {
      console.error(`Failed to migrate wishlist ${w._id}:`, err);
    }
  }
  console.log(`Wishlists migrated: ${stats.wishlists.written} / ${stats.wishlists.read}`);

  console.log("\n=== DATA MIGRATION SUMMARY ===");
  console.table(stats);

  await mongoose.disconnect();
  await mysql.close();
  console.log("Migration complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
