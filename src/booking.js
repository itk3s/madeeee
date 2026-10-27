export const tables = [
  { id: 1, seats: 2, area: "الصالة الداخلية" },
  { id: 2, seats: 2, area: "بجانب النافذة" },
  { id: 3, seats: 4, area: "الصالة الداخلية" },
  { id: 4, seats: 4, area: "التراس" },
  { id: 5, seats: 6, area: "التراس" },
  { id: 6, seats: 8, area: "الجلسة العائلية" },
];
export const slots = Array.from(
  { length: 11 },
  (_, i) => `${String(i + 12).padStart(2, "0")}:00`,
);
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function available(table, date, time, guests, bookings) {
  const start = new Date(`${date}T${time}`).getTime();
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    slots.includes(time) &&
    Number.isInteger(Number(guests)) &&
    Number(guests) >= 1 &&
    Number(guests) <= 8 &&
    Number.isFinite(start) &&
    start > Date.now() &&
    table.seats >= Number(guests) &&
    !bookings.some(
      (b) =>
        b.tableId === table.id &&
        b.status !== "cancelled" &&
        b.status !== "no-show" &&
        Math.abs(new Date(`${b.date}T${b.time}`).getTime() - start) <
          90 * 60000,
    )
  );
}
export const statusNames = {
  confirmed: "مؤكد",
  arrived: "حضر الزبون",
  completed: "مكتمل",
  cancelled: "ملغى",
  "no-show": "لم يحضر",
};
