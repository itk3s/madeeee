import { createElement, useEffect, useState } from "react";
import {
  UtensilsCrossed,
  ArrowUpLeft,
  Clock,
  Users,
  CalendarDays,
  Armchair,
  Check,
  Menu,
  Sun,
  Moon,
  Heart,
  Search,
  Printer,
} from "lucide-react";
import { tables, slots, today, available, statusNames } from "./booking";
import "./restaurant.css";

const dishes = [
  ["المقبلات", "حمّص بالطحينة", "حمّص ناعم وزيت زيتون بكر", "25,000", "◒"],
  ["المقبلات", "فتّوش شامي", "خضار موسمية وخبز مقرمش", "30,000", "❋"],
  [
    "الأطباق الرئيسية",
    "مشاوي المائدة",
    "مشاوي على الفحم مع الخضار",
    "120,000",
    "♨",
  ],
  [
    "الأطباق الرئيسية",
    "دجاج بالأعشاب",
    "دجاج مشوي مع صلصة الأعشاب",
    "85,000",
    "✦",
  ],
  ["الحلويات", "كنافة بالفستق", "قشطة طازجة وفستق حلبي", "40,000", "◈"],
  ["المشروبات", "ليمون ونعناع", "ليمون طازج ونعناع وثلج", "20,000", "❧"],
];
function load() {
  try {
    const value = JSON.parse(localStorage.getItem("maeda-demo") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
export default function Restaurant() {
  const [page, setPage] = useState("home"),
    [mobile, setMobile] = useState(false),
    [bookings, setBookings] = useState(load);
  const [form, setForm] = useState({
    date: today(),
    time: "19:00",
    guests: "2",
    name: "",
    phone: "",
    notes: "",
  });
  const [selected, setSelected] = useState(null),
    [receipt, setReceipt] = useState(null),
    [error, setError] = useState(""),
    [category, setCategory] = useState("الكل");
  const [lookup, setLookup] = useState(""),
    [searched, setSearched] = useState(false),
    [date, setDate] = useState(today()),
    [status, setStatus] = useState("all");
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("maeda-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("default"),
    [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("maeda-favorites") || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });
  const [editing, setEditing] = useState(null),
    [area, setArea] = useState("الكل");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("maeda-theme", theme);
    } catch {
      /* Theme still works in memory. */
    }
  }, [theme]);
  function favorite(name) {
    const next = favorites.includes(name)
      ? favorites.filter((n) => n !== name)
      : [...favorites, name];
    setFavorites(next);
    try {
      localStorage.setItem("maeda-favorites", JSON.stringify(next));
    } catch {
      /* Favorites still work in memory. */
    }
  }
  function editBooking(b) {
    setEditing(b.id);
    setForm({
      date: b.date,
      time: b.time,
      guests: b.guests,
      name: b.name,
      phone: b.phone,
      notes: b.notes || "",
    });
    setSelected(b.tableId);
    setReceipt(null);
    go("book");
  }
  function exportBookings() {
    const rows = [
      [
        "رقم الحجز",
        "الاسم",
        "الهاتف",
        "التاريخ",
        "الوقت",
        "الطاولة",
        "الضيوف",
        "الحالة",
      ],
      ...daily
        .filter((b) => status === "all" || b.status === status)
        .map((b) => [
          b.id,
          b.name,
          b.phone,
          b.date,
          b.time,
          b.tableId,
          b.guests,
          statusNames[b.status],
        ]),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((r) =>
          r
            .map(
              (v) =>
                '"' +
                String(v)
                  .replace(/^[=+@-]/, "'")
                  .replaceAll('"', '""') +
                '"',
            )
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `maeda-${date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("تم تصدير الحجوزات المطابقة للتصفية.");
  }
  const filteredDishes = dishes
    .filter(
      (d) =>
        (category === "الكل" || d[0] === category) &&
        (!favoritesOnly || favorites.includes(d[1])) &&
        `${d[1]} ${d[2]}`.includes(query.trim()),
    )
    .sort((a, b) =>
      sort === "default"
        ? 0
        : (Number(a[3].replaceAll(",", "")) -
            Number(b[3].replaceAll(",", ""))) *
          (sort === "desc" ? -1 : 1),
    );
  const go = (p) => {
    setPage(p);
    setMobile(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const field = (key, value) => {
    setForm({ ...form, [key]: value });
    setError("");
    if (["date", "time", "guests"].includes(key)) setSelected(null);
  };
  function save(next) {
    try {
      localStorage.setItem("maeda-demo", JSON.stringify(next));
      setBookings(next);
      return true;
    } catch {
      setError("تعذّر الحفظ في المتصفح.");
      return false;
    }
  }
  function reserve(e) {
    e.preventDefault();
    const current = load(),
      others = current.filter((b) => b.id !== editing),
      table = tables.find((t) => t.id === selected);
    if (
      editing &&
      !current.some((b) => b.id === editing && b.status === "confirmed")
    )
      return setError("لم يعد هذا الحجز قابلًا للتعديل.");
    if (!table || !available(table, form.date, form.time, form.guests, others))
      return setError("اختر طاولة متاحة وموعدًا مستقبليًا.");
    if (form.name.trim().length < 2 || !/^[+\d\s()-]{8,20}$/.test(form.phone))
      return setError("أدخل اسمًا صحيحًا ورقم هاتف صالحًا.");
    const b = {
      ...form,
      name: form.name.trim(),
      tableId: selected,
      id: editing || `MD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: "confirmed",
    };
    if (
      save(
        editing
          ? current.map((old) => (old.id === editing ? b : old))
          : [...current, b],
      )
    ) {
      setReceipt(b);
      setEditing(null);
      setNotice("تم حفظ الحجز بنجاح.");
    }
  }
  function update(id, value) {
    const current = load(),
      b = current.find((b) => b.id === id);
    if (!b) return;
    if (["confirmed", "arrived"].includes(value)) {
      const table = tables.find((t) => t.id === b.tableId);
      if (
        !table ||
        !available(
          table,
          b.date,
          b.time,
          b.guests,
          current.filter((x) => x.id !== id),
        )
      ) {
        setError("لا يمكن تفعيل الحجز: الموعد مضى أو الطاولة غير متاحة.");
        return;
      }
    }
    if (save(current.map((b) => (b.id === id ? { ...b, status: value } : b)))) {
      setError("");
      setNotice("تم تحديث حالة الحجز.");
    }
  }
  const fields = (
    <div className="search-fields">
      <label>
        <CalendarDays size={15} /> التاريخ
        <input
          required
          type="date"
          min={today()}
          value={form.date}
          onChange={(e) => field("date", e.target.value)}
        />
      </label>
      <label>
        <Clock size={15} /> الوقت
        <select
          value={form.time}
          onChange={(e) => field("time", e.target.value)}
        >
          {slots.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        <Users size={15} /> الضيوف
        <select
          value={form.guests}
          onChange={(e) => field("guests", e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n} أشخاص
            </option>
          ))}
        </select>
      </label>
    </div>
  );
  const daily = bookings.filter((b) => b.date === date),
    found = bookings.filter(
      (b) => b.id.toLowerCase() === lookup.trim().toLowerCase(),
    );
  return (
    <div className="restaurant" dir="rtl">
      <a className="skip-link" href="#main-content">
        انتقل إلى المحتوى
      </a>
      <header>
        <a
          className="brand"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="brand-icon">
            <UtensilsCrossed />
          </span>
          <span>
            المائدة<small>MAEDA RESTAURANT</small>
          </span>
        </a>
        <button
          className="mobile-toggle"
          aria-label="القائمة"
          onClick={() => setMobile(!mobile)}
        >
          <Menu />
        </button>
        <button
          className="theme-toggle"
          aria-label={
            theme === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الداكن"
          }
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <nav className={mobile ? "open" : ""}>
          {[
            ["home", "الرئيسية"],
            ["menu", "قائمة الطعام"],
            ["book", "احجز طاولتك"],
            ["reservations", "حجزي"],
            ["admin", "لوحة الإدارة"],
          ].map(([p, label]) => (
            <button
              key={p}
              className={page === p ? "active" : ""}
              onClick={() => go(p)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button
          className="primary nav-cta"
          onClick={() => {
            setReceipt(null);
            setEditing(null);
            setSelected(null);
            go("book");
          }}
        >
          حجز طاولة <ArrowUpLeft size={17} />
        </button>
      </header>
      <main id="main-content">
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button aria-label="إغلاق الإشعار" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}
        {page === "home" && (
          <>
            <section className="hero">
              <span className="eyebrow">✦ نكهات تجمعنا، ولحظات تبقى</span>
              <h1>
                لكل لحظة جميلة،
                <br />
                <em>مكان على مائدتنا.</em>
              </h1>
              <p>
                أطباق تُحضّر بشغف، وأجواء تشبهك.
                <br />
                اختر وقتك المفضّل، ودع بقيّة التفاصيل علينا.
              </p>
              <div className="actions">
                <button className="primary" onClick={() => go("book")}>
                  احجز تجربتك <ArrowUpLeft size={18} />
                </button>
                <button className="secondary" onClick={() => go("menu")}>
                  اكتشف قائمة الطعام
                </button>
              </div>
              <small className="muted">
                مذاق شامي أصيل &nbsp; · &nbsp; جلسات داخلية وتراس
              </small>
              <div className="orbit one" />
              <div className="orbit two" />
            </section>
            <section className="quick glass">
              <div>
                <span className="eyebrow">خطّط لزيارتك</span>
                <h2>طاولتك تنتظرك</h2>
              </div>
              {fields}
              <button className="primary" onClick={() => go("book")}>
                ابحث عن طاولة <ArrowUpLeft size={17} />
              </button>
            </section>
            <section className="section">
              <span className="eyebrow">التفاصيل تصنع الفرق</span>
              <h2>أكثر من مجرّد وجبة</h2>
              <div className="cards">
                {[
                  [
                    UtensilsCrossed,
                    "نكهة من القلب",
                    "وصفات شامية ومكونات مختارة بعناية.",
                  ],
                  [
                    Armchair,
                    "مكان لكل مناسبة",
                    "جلسة هادئة أو لقاء أصدقاء أو لمّة عائلية.",
                  ],
                  [
                    CalendarDays,
                    "حجز بخطوات بسيطة",
                    "اختر الموعد والطاولة وأكّد حجزك مباشرة.",
                  ],
                ].map(([Icon, title, text], i) => (
                  <article className="glass feature" key={title}>
                    <span className="number">0{i + 1}</span>
                    {createElement(Icon, { size: 28 })}
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="visit glass">
              <div>
                <span className="eyebrow">أهلًا بك على المائدة</span>
                <h2>موعدك القادم مع النكهة.</h2>
                <p>يوميًا من 12 ظهرًا إلى 12 منتصف الليل</p>
              </div>
              <button className="primary" onClick={() => go("book")}>
                اختر طاولتك <ArrowUpLeft size={18} />
              </button>
            </section>
          </>
        )}
        {page === "menu" && (
          <section className="section page">
            <span className="eyebrow">محضّرة بشغف</span>
            <h1>على قائمة المائدة</h1>
            <p className="muted">قائمة وأسعار توضيحية بالليرة السورية.</p>
            <div className="menu-tools glass">
              <label>
                <Search size={16} /> ابحث عن طبق
                <input
                  placeholder="اسم الطبق أو المكونات"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label>
                الترتيب
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="default">الترتيب الافتراضي</option>
                  <option value="asc">السعر: الأقل أولًا</option>
                  <option value="desc">السعر: الأعلى أولًا</option>
                </select>
              </label>
              <button
                className="secondary"
                aria-pressed={favoritesOnly}
                onClick={() => setFavoritesOnly(!favoritesOnly)}
              >
                <Heart
                  size={16}
                  fill={favoritesOnly ? "currentColor" : "none"}
                />{" "}
                {favoritesOnly ? "عرض كل الأطباق" : "المفضلة"}
              </button>
            </div>
            <div className="tabs">
              {[
                "الكل",
                "المقبلات",
                "الأطباق الرئيسية",
                "الحلويات",
                "المشروبات",
              ].map((c) => (
                <button
                  key={c}
                  className={category === c ? "selected" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="cards">
              {filteredDishes.map((d) => (
                <article className="glass dish" key={d[1]}>
                  <button
                    className="favorite-button"
                    aria-label={`تفضيل ${d[1]}`}
                    aria-pressed={favorites.includes(d[1])}
                    onClick={() => favorite(d[1])}
                  >
                    <Heart
                      size={19}
                      fill={favorites.includes(d[1]) ? "currentColor" : "none"}
                    />
                  </button>
                  <div className="dish-art" aria-hidden="true">
                    {d[4]}
                  </div>
                  <span className="eyebrow">{d[0]}</span>
                  <h2>{d[1]}</h2>
                  <p>{d[2]}</p>
                  <strong>
                    {d[3]} <small>ل.س</small>
                  </strong>
                </article>
              ))}
            </div>
            {!filteredDishes.length && (
              <div className="glass empty">
                لا توجد أطباق مطابقة. جرّب بحثًا آخر أو ألغِ تصفية المفضلة.
              </div>
            )}
          </section>
        )}
        {page === "book" && (
          <section className="section page">
            <span className="eyebrow">خطوة أقرب إلى لحظة جميلة</span>
            <h1>{editing ? "تعديل تفاصيل الحجز" : "احجز مكانك على المائدة"}</h1>
            <p className="muted">
              مدة الجلسة 90 دقيقة. آخر موعد للحجز الساعة 22:00.
            </p>
            {receipt ? (
              <div className="glass receipt">
                <Check size={38} />
                <h2>تم حفظ الحجز التجريبي!</h2>
                <p>أهلًا {receipt.name}، هذه تفاصيل زيارتك.</p>
                <code>{receipt.id}</code>
                <p>
                  {receipt.date} · {receipt.time} · {receipt.guests} أشخاص ·
                  الطاولة {receipt.tableId}
                </p>
                <p className="muted">
                  احتفظ برقم الحجز. البيانات محلية ولا يتم إرسال رسائل هاتفية.
                </p>
                <div className="actions">
                  <button className="secondary" onClick={() => window.print()}>
                    <Printer size={16} /> طباعة التأكيد
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      setLookup(receipt.id);
                      setSearched(true);
                      go("reservations");
                    }}
                  >
                    عرض الحجز
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setReceipt(null);
                      setSelected(null);
                    }}
                  >
                    حجز جديد
                  </button>
                </div>
              </div>
            ) : (
              <form className="booking-layout" onSubmit={reserve}>
                <div>
                  <div className="glass panel">
                    <h2>
                      <span className="step">1</span> اختر موعد الزيارة
                    </h2>
                    {fields}
                  </div>
                  <div className="glass panel">
                    <h2>
                      <span className="step">2</span> اختر طاولتك
                    </h2>
                    <label className="area-filter">
                      نوع الجلسة
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                      >
                        {["الكل", ...new Set(tables.map((t) => t.area))].map(
                          (a) => (
                            <option key={a}>{a}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <p className="muted fine">
                      الطاولات الباهتة لا تناسب الموعد أو عدد الضيوف.
                    </p>
                    <div className="tables">
                      {tables
                        .filter((t) => area === "الكل" || t.area === area)
                        .map((t) => {
                          const free = available(
                            t,
                            form.date,
                            form.time,
                            form.guests,
                            bookings.filter((b) => b.id !== editing),
                          );
                          return (
                            <button
                              type="button"
                              key={t.id}
                              disabled={!free}
                              className={`table-choice ${selected === t.id ? "chosen" : ""}`}
                              onClick={() => setSelected(t.id)}
                            >
                              <Armchair />
                              <strong>طاولة {t.id}</strong>
                              <small>
                                {t.seats} مقاعد · {t.area}
                              </small>
                              <span>
                                {selected === t.id
                                  ? "تم الاختيار"
                                  : free
                                    ? "متاحة"
                                    : "غير متاحة"}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
                <aside className="glass panel">
                  <h2>
                    <span className="step">3</span> بيانات الحجز
                  </h2>
                  <label>
                    الاسم الكامل
                    <input
                      required
                      minLength={2}
                      maxLength={80}
                      value={form.name}
                      onChange={(e) => field("name", e.target.value)}
                      placeholder="كيف نناديك؟"
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    رقم الهاتف
                    <input
                      type="tel"
                      dir="ltr"
                      required
                      maxLength={20}
                      value={form.phone}
                      onChange={(e) => field("phone", e.target.value)}
                      placeholder="09xxxxxxxx"
                      autoComplete="tel"
                    />
                  </label>
                  <label>
                    طلبات خاصة <small>اختياري</small>
                    <textarea
                      maxLength={400}
                      value={form.notes}
                      onChange={(e) => field("notes", e.target.value)}
                      placeholder="مناسبة خاصة أو ملاحظات للزيارة"
                    />
                  </label>
                  <div className="summary">
                    <p>
                      الطاولة{" "}
                      <strong>
                        {selected ? `رقم ${selected}` : "لم تُحدد بعد"}
                      </strong>
                    </p>
                    <p>
                      مدة الجلسة <strong>90 دقيقة</strong>
                    </p>
                    <p>
                      رسوم الحجز <strong>مجاني</strong>
                    </p>
                  </div>
                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="primary full">
                    {editing ? "حفظ التعديلات" : "تأكيد الحجز"}{" "}
                    <Check size={17} />
                  </button>
                  <p className="muted fine">
                    تجربة واجهة فقط. البيانات محفوظة في هذا المتصفح.
                  </p>
                </aside>
              </form>
            )}
          </section>
        )}
        {page === "reservations" && (
          <section className="section page narrow">
            <span className="eyebrow">كل تفاصيل زيارتك</span>
            <h1>تابع حجزك</h1>
            <form
              className="glass panel lookup"
              onSubmit={(e) => {
                e.preventDefault();
                setBookings(load());
                setSearched(true);
              }}
            >
              <label>
                رقم الحجز
                <input
                  required
                  dir="ltr"
                  placeholder="MD-XXXXXXXX"
                  value={lookup}
                  onChange={(e) => {
                    setLookup(e.target.value);
                    setSearched(false);
                  }}
                />
              </label>
              <button className="primary">عرض الحجز</button>
            </form>
            {searched && !found.length && (
              <div className="glass empty">
                لم نجد هذا الرقم في هذا المتصفح.
              </div>
            )}
            {searched &&
              found.map((b) => (
                <article className="glass panel" key={b.id}>
                  <span className={`badge ${b.status}`}>
                    {statusNames[b.status]}
                  </span>
                  <h2>{b.name}</h2>
                  <code>{b.id}</code>
                  <p>
                    {b.date} · {b.time} · {b.guests} أشخاص
                  </p>
                  <p>الطاولة {b.tableId}</p>
                  {b.status === "confirmed" &&
                    new Date(`${b.date}T${b.time}`) > new Date() && (
                      <div className="reservation-actions">
                        <button
                          className="secondary"
                          onClick={() => editBooking(b)}
                        >
                          تعديل الحجز
                        </button>
                        <button
                          className="danger"
                          onClick={() => {
                            if (window.confirm("هل تريد إلغاء الحجز؟"))
                              update(b.id, "cancelled");
                          }}
                        >
                          إلغاء الحجز
                        </button>
                      </div>
                    )}
                </article>
              ))}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
        )}
        {page === "admin" && (
          <section className="section page">
            <span className="eyebrow">نظرة على يوم المطعم</span>
            <h1>إدارة الحجوزات</h1>
            <div className="demo-banner">
              واجهة إدارة تجريبية — بيانات محلية دون خادم أو تسجيل دخول.
            </div>
            <div className="stats">
              {[
                ["حجوزات اليوم المحدد", daily.length],
                [
                  "حجوزات مؤكدة",
                  daily.filter((b) => b.status === "confirmed").length,
                ],
                [
                  "ضيوف متوقعون",
                  daily
                    .filter((b) => ["confirmed", "arrived"].includes(b.status))
                    .reduce((n, b) => n + Number(b.guests), 0),
                ],
                ["طاولات المطعم", tables.length],
              ].map(([label, n]) => (
                <article className="glass" key={label}>
                  <span>{label}</span>
                  <strong>{n}</strong>
                </article>
              ))}
            </div>
            <div className="glass panel">
              <div className="toolbar">
                <h2>سجل الحجوزات</h2>
                <button className="secondary" onClick={exportBookings}>
                  تصدير CSV
                </button>
                <label>
                  التاريخ
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <select
                  aria-label="تصفية الحالة"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">كل الحالات</option>
                  {Object.entries(statusNames).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  className="secondary"
                  onClick={() => {
                    setReceipt(null);
                    setEditing(null);
                    setSelected(null);
                    go("book");
                  }}
                >
                  إضافة حجز
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {[
                        "الزبون",
                        "الموعد",
                        "الطاولة / الضيوف",
                        "الحالة",
                        "تحديث الحالة",
                      ].map((t) => (
                        <th key={t}>{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daily
                      .filter((b) => status === "all" || b.status === status)
                      .map((b) => (
                        <tr key={b.id}>
                          <td>
                            <strong>{b.name}</strong>
                            <small dir="ltr">{b.phone}</small>
                            <small>{b.id}</small>
                            {b.notes && <small>{b.notes}</small>}
                          </td>
                          <td>{b.time}</td>
                          <td>
                            {b.tableId} / {b.guests}
                          </td>
                          <td>
                            <span className={`badge ${b.status}`}>
                              {statusNames[b.status]}
                            </span>
                          </td>
                          <td>
                            <select
                              aria-label={`حالة حجز ${b.name}`}
                              value={b.status}
                              onChange={(e) => update(b.id, e.target.value)}
                            >
                              {Object.entries(statusNames).map(([v, l]) => (
                                <option key={v} value={v}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!daily.filter((b) => status === "all" || b.status === status)
                  .length && (
                  <div className="empty">
                    لا توجد حجوزات مطابقة. أضف حجزًا لتجربة الواجهة.
                  </div>
                )}
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <h2>طاولات المطعم</h2>
            <div className="tables">
              {tables.map((t) => (
                <article className="glass panel" key={t.id}>
                  <Armchair />
                  <h3>طاولة {t.id}</h3>
                  <p className="muted">
                    {t.seats} مقاعد · {t.area}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer>
        <span className="brand">
          <UtensilsCrossed size={20} /> المائدة
        </span>
        <div className="design-credit">
          <span>تم التصميم بواسطة</span>
          <strong>المهندسة سارة توتونجي</strong>
        </div>
        <small>نموذج فرونت إند · بيانات محلية تجريبية</small>
      </footer>
    </div>
  );
}
