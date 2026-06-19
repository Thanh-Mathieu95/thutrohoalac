# NHẬT KÝ SỬA ĐỔI DỰ ÁN (Cập nhật ngày 10/06/2026)

Tài liệu này ghi lại toàn bộ các tính năng và lỗi đã được chỉnh sửa hôm nay để bạn dễ dàng theo dõi và tiếp tục phát triển trong lần sau.

---

## 🔍 1. Bộ Lọc Tìm Kiếm Trang Chủ (Hero Search Bar Widget)
*   **Mô tả:** Thay thế thanh tìm kiếm mặc định bằng Widget tìm kiếm cỡ lớn phong cách Airbnb (`max-w-4xl`) trên trang chủ.
*   **Chức năng:** Tích hợp đồng thời 4 bộ lọc:
    1.  **Từ khóa / Tên trọ:** Nhập văn bản tự do.
    2.  **Khu vực:** Dropdown chọn nhanh các vùng ở Hòa Lạc (*FPT, ĐHQG, Tân Xã, Bình Yên, Thạch Hòa*).
    3.  **Tiện nghi:** Lọc nhanh phòng có *Điều hòa, Tủ lạnh, Máy giặt, Ban công, Nóng lạnh*.
    4.  **Mức giá:** Chọn nhanh khoảng giá phù hợp.
*   **Trải nghiệm người dùng (UX):**
    *   **Desktop:** Hiển thị dạng viên thuốc nằm ngang sang trọng, hover đổi màu nền từng phân vùng.
    *   **Mobile:** Tự động xếp dọc thành các thẻ chạm tối ưu cho ngón tay.
    *   **Realtime:** Dữ liệu tự động lọc tức thời bên dưới ngay khi bấm chọn bộ lọc và đồng bộ 2 chiều với thanh filter dính (sticky pill row).

---

## 🗺️ 2. Bản Đồ Ghim Vị Trí Trực Quan (Map Picker)
*   **Mô tả:** Tích hợp bản đồ chọn vị trí trực quan sử dụng thư viện **React Leaflet** và dữ liệu **OpenStreetMap** giúp chủ trọ ghim vị trí thay vì nhập tọa độ tay.
*   **Các file chỉnh sửa/tạo mới:**
    *   `[NEW]` [src/components/map-picker.tsx](file:///c:/Users/MSI%20PC/THUETROHOALAC/src/components/map-picker.tsx): Component bản đồ chọn vị trí (client-side only).
    *   `[MODIFY]` [src/app/owner/page.tsx](file:///c:/Users/MSI%20PC/THUETROHOALAC/src/app/owner/page.tsx): Nhúng bản đồ vào form Sửa/Thêm nhà trọ của Chủ trọ.
*   **Điểm nổi bật:**
    *   Mặc định tâm bản đồ tự động căn về khu vực **Hòa Lạc (~21.0125, 105.5269)** (thay vì TP.HCM) để chủ trọ tìm đường nhanh hơn.
    *   Chủ trọ chỉ cần **Click chuột/Chạm màn hình** vào vị trí trọ trên bản đồ, hệ thống sẽ tự động điền Kinh độ/Vĩ độ chính xác vào form.
    *   **Bảo mật:** Trang chi tiết phòng trọ của khách thuê (`/rooms/[id]`) chỉ hiển thị vòng tròn bán kính **150m** bao quanh tọa độ này nhằm bảo vệ địa chỉ chi tiết của chủ nhà.

---

## 📱 3. Sửa Lỗi Giao Diện Chọn Tab Trên Điện Thoại (Mobile Tab Navigation)
*   **Vấn đề:** Trên mobile, menu bên trái (Sidebar) bị ẩn đi khiến chủ trọ bị kẹt ở tab "Loại phòng cho thuê" và không thể chuyển về tab "Nhà trọ của tôi" để bấm Sửa nhà trọ.
*   **Giải pháp đã sửa:**
    *   Thêm một thanh **Mobile Tab Row** trên giao diện điện thoại (`md:hidden`) để dễ dàng chuyển đổi qua lại.
    *   Kích hoạt tính năng **nhấp chuột vào 3 thẻ thống kê trên cùng** (Nhà trọ của tôi, Bài đăng phòng, Ảnh chờ duyệt) để chuyển tab tương ứng.

---

## ☁️ 4. Tải Ảnh Lên Supabase Storage
*   **Offline First:** Khi chọn ảnh, ảnh lưu tạm dưới dạng Base64 vào trình duyệt (`IndexedDB`) để hiển thị album ngay lập tức mà không cần chờ mạng tải.
*   **Cloud Sync:** Khi nhấn **Lưu (Save)**, ảnh tự động đẩy lên bucket đám mây **Supabase Storage** (`thuetro_images`) và lưu URL trực tuyến vào database.
*   **Thiết lập Supabase (SQL Editor):**
    ```sql
    -- 1. Tạo bucket 'thuetro_images' ở chế độ công khai (public)
    insert into storage.buckets (id, name, public)
    values ('thuetro_images', 'thuetro_images', true)
    on conflict (id) do nothing;

    -- 2. Cho phép mọi người xem ảnh công khai (SELECT)
    create policy "Allow Public Access" on storage.objects
      for select using (bucket_id = 'thuetro_images');

    -- 3. Cho phép tải ảnh lên (INSERT)
    create policy "Allow Public Uploads" on storage.objects
      for insert with check (bucket_id = 'thuetro_images');

    -- 4. Cho phép xóa ảnh (DELETE)
    create policy "Allow Public Deletes" on storage.objects
      for delete using (bucket_id = 'thuetro_images');
    ```
