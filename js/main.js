// Main JavaScript for THUETROHOALAC

document.addEventListener('DOMContentLoaded', () => {
    console.log('Hệ thống Thuê Trọ Hòa Lạc đã sẵn sàng!');
    
    // Giả lập dữ liệu phòng trọ
    const rooms = [
        { id: 1, title: 'Phòng trọ cao cấp gần FPT', price: '2.500.000đ', area: '25m2', location: 'Thạch Hòa' },
        { id: 2, title: 'Chung cư mini Tân Xã', price: '3.000.000đ', area: '30m2', location: 'Tân Xã' },
        { id: 3, title: 'Phòng giá rẻ cho sinh viên', price: '1.500.000đ', area: '15m2', location: 'Bình Yên' }
    ];

    renderRooms(rooms);
});

/**
 * Hiển thị danh sách phòng trọ lên giao diện
 * @param {Array} roomsList 
 */
function renderRooms(roomsList) {
    const roomGrid = document.getElementById('room-grid');
    if (!roomGrid) return;

    roomGrid.innerHTML = roomsList.map(room => `
        <div class="room-card" style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1rem;">
            <h3>${room.title}</h3>
            <p><strong>Giá:</strong> ${room.price}</p>
            <p><strong>Diện tích:</strong> ${room.area}</p>
            <p><strong>Khu vực:</strong> ${room.location}</p>
            <button class="btn-primary" style="margin-top: 0.5rem; width: 100%;">Xem chi tiết</button>
        </div>
    `).join('');
}
