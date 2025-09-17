import React, { useState, useEffect } from "react"; //นำเข้า React และ Hooks
import {
  View, //กรอบการมองเห็น
  Text,  //ข้อความ
  StyleSheet, //สไตล์
  ScrollView,  //เลื่อนหน้าจ
  TouchableOpacity, //ปุ่มกด
  ActivityIndicator, //โหลดสถานะ
  Platform, //ตรวจสอบแพลตฟอร์ม
  TextInput, //ช่องกรอกข้อมูล
  KeyboardAvoidingView, //คีย์บอร์ด
  Image, //รูปภาพ
  Modal, // เพิ่มตรงนี้
} from "react-native";
import Papa from "papaparse"; // libraly สำหรับ ดึง ไฟล์จาก google  เป็น csv  เพื่อ เป็นไฟล์ json
import { NavigationContainer } from "@react-navigation/native"; //ตัวนำทาง  navigation
import { createNativeStackNavigator } from "@react-navigation/native-stack";  //คือการสร้าง stack navigator หมายถึง การจัดการหน้าจอแบบซ้อนกัน
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; //สร้างแถบด่านล่าง
import Ionicons from "react-native-vector-icons/Ionicons"; //ไอคอน
import { useFonts, Kanit_400Regular, Kanit_500Medium } from "@expo-google-fonts/kanit"; //ฟอนต์
import DateTimePicker from "@react-native-community/datetimepicker";//ตัวเลือกวันที่

const SHEET_ID = "1jBgNeG02TpFmNRx-Pl_e7-NSzkYy5F8iMxDEBriNVi8"; //ตัวแปทรที่เก็บที่อยู่ของ google sheet
const Stack = createNativeStackNavigator();//สร้าง stack navigator
const Tab = createBottomTabNavigator(); //สร้างแถบด่านล่าง

//--- HomeScreen (หน้าหลัก) ---
function HomeScreen({ navigation }) {
  //--- state zone ---
  const [todayData, setTodayData] = useState([]); //ข้อมูลวันนี้
  const [error, setError] = useState(""); //ข้อความผิดพลาด
  const [loading, setLoading] = useState(true);//สถานะการโหลด เป็นtrueเพราะว่าเริ่มต้นจะโหลดข้อมูล พูดง่ายๆคือ กำลังโหลด
  const [showAd, setShowAd] = useState(true);//สถานะการแสดงโฆษณา เริ่มต้นเป็น true เพื่อแสดงโฆษณาเมื่อเข้าหน้า Home)

  //--- function zone ---
  const getTodaySheet = () => {
    const now = new Date(); //วันที่ปัจจุบัน เหตุผลที่ใช้ new Date() เพราะว่าเป็นฟังก์ชันใน JavaScript ที่ใช้สำหรับสร้างออบเจ็กต์วันที่และเวลา
    const yyyy = now.getFullYear(); //ปี ค.ศ. 4 หลัก เช่น 2024 เหตุผลที่ใช้ now.getFullYear() เพราะว่าเป็นเมธอดของออบเจ็กต์ Date ที่ใช้ดึงค่าปีในรูปแบบ 4 หลัก
    const mm = String(now.getMonth() + 1).padStart(2, "0"); //เดือน (0-11) + 1 เพื่อให้เป็น (1-12) และ padStart(2, "0") เพื่อเติม 0 ข้างหน้าให้เป็น 2 หลัก เช่น 01, 02, ..., 12 เหตุผลที่ใช้ now.getMonth() + 1 เพราะว่าเป็นเมธอดของออบเจ็กต์ Date ที่ใช้ดึงค่าเดือน โดยเดือนมักจะเริ่มต้นที่ 0 (มกราคม) ถึง 11 (ธันวาคม) ดังนั้นจึงต้องบวก 1 เพื่อให้ได้เดือนที่ถูกต้อง
    const dd = String(now.getDate()).padStart(2, "0");//วัน (1-31) และ padStart(2, "0") เพื่อเติม 0 ข้างหน้าให้เป็น 2 หลัก เช่น 01, 02, ..., 31 เหตุผลที่ใช้ now.getDate() เพราะว่าเป็นเมธอดของออบเจ็กต์ Date ที่ใช้ดึงค่าวันในเดือน
    return `${yyyy}-${mm}-${dd}`;//คืนค่าเป็นสตริงในรูปแบบ "YYYY-MM-DD" เช่น "2024-06-15"
  };
  // Funtion แปลงวันที่จาก "YYYY-MM-DD" เป็น "DD/MM/YYYY"
  const formatDate = (dateStr) => {
    if (!dateStr) return ""; //ถ้าไม่มีค่า dateStr ให้คืนค่าว่าง
    const parts = dateStr.split("-"); //แยกสตริงโดยใช้ "-" เป็นตัวคั่น
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`; //ถ้ามี 3 ส่วน ให้คืนค่าสลับตำแหน่งเป็น "DD/MM/YYYY"
    return dateStr; //ถ้าไม่ใช่ ให้คืนค่าเดิม
  };

  const formatTime = (datetime) => { //ฟังก์ชันแปลงเวลา
    if (!datetime) return ""; //ถ้าไม่มีค่า datetime ให้คืนค่าว่าง
    const match = datetime.match(/T(\d{2}:\d{2})/); //ใช้ regex เพื่อดึงเวลาในรูปแบบ "HH:MM" จากสตริง datetime
    return match ? match[1] : datetime; //ถ้าพบ match ให้คืนค่าเวลาในรูปแบบ "HH:MM" มิฉะนั้นคืนค่าเดิม
  };

  const fetchToday = async () => {
    const sheetName = getTodaySheet();
    try {
      setLoading(true);
      setError("");
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      const res = await fetch(url);
      const text = await res.text();

      if (text.includes("DOCTYPE") || text.includes("error")) {
        setTodayData([]);
        setError("❌ ไม่พบข้อมูลของวันนี้");
        return;
      }

      const parsed = Papa.parse(text, { header: false });
      setTodayData(parsed.data.slice(1)); // ตัด header
    } catch (err) {
      setTodayData([]);
      setError("❌ ไม่พบข้อมูลของวันนี้");
    } finally {
      setLoading(false);
    }
  };

  // ให้แสดงโฆษณาทุกครั้งที่เข้าหน้านี้
  useEffect(() => {
    setShowAd(true); // <<<< เพิ่มบรรทัดนี้
    fetchToday();
  }, []);

  return (
    <>
      {/* --- Pop-up ภาพโฆษณา (Modal) --- */}
      <Modal
        visible={showAd}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAd(false)}
      >
        <View style={stylesAd.overlay}>
          <View style={stylesAd.popup}>
            {/* --- โลโก้ในโฆษณา --- */}
            <Image
              source={require("./assets/PISTON PIN MYCOM B.png")}
              style={stylesAd.image}
              resizeMode="contain"
            />
            {/* --- ปุ่มปิดโฆษณา --- */}
            <TouchableOpacity
              style={stylesAd.button}
              onPress={() => setShowAd(false)}
            >
              <Text style={stylesAd.buttonText}>ปิดโฆษณา</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- เนื้อหา Home --- */}
      <ScrollView contentContainerStyle={stylesHome.container}>
        {/* --- โลโก้บนสุด --- */}
        <Image
          source={require("./assets/SCCE_logo-i.png")}
          style={stylesHome.logo}
          resizeMode="contain"
        />

        {/* --- ข้อความต้อนรับ --- */}
        <Text style={stylesHome.title}>ยินดีต้อนรับ</Text>
        <Text style={stylesHome.subtitle}>เลือกเมนูที่ต้องการ</Text>
      
        {/* --- ปุ่มเมนูหลัก --- */}
        <View style={stylesHome.buttonRow}>
          {/* --- ปุ่มวันเดียว --- */}
          <TouchableOpacity
            style={[stylesHome.button, { backgroundColor: "#000000ff" }]}
            onPress={() => navigation.navigate("CheckData")}
          >
            <Ionicons name="analytics" size={20} color="#fff" />
            <Text style={stylesHome.buttonText}> วันเดียว</Text>
          </TouchableOpacity>

          {/* --- ปุ่มช่วงวัน --- */}
          <TouchableOpacity
            style={[stylesHome.button, { backgroundColor: "#26d970ff" }]}
            onPress={() => navigation.navigate("RangeData")}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={stylesHome.buttonText}> ช่วงวัน</Text>
          </TouchableOpacity>
        </View>

        {/* --- ข้อมูลของวันนี้ --- */}
        <View style={{ marginTop: 25, width: "100%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name="today" size={22} color="#0a0a0aff" style={{ marginTop: -9, margin:2}}/>
            <Text style={stylesHome.sectionTitle}> ข้อมูลของวันนี้</Text>
          </View>

          {/* --- Loading, Error, Table --- */}
          {loading && <ActivityIndicator size="large" color="#20c35cff" style={{ marginVertical: 20 }} />}
          {!loading && error ? (
            <Text style={stylesHome.errorText}>{error}</Text>
          ) : null}
          {!loading && todayData.length > 0 && (
            <View>
              {/* --- ตารางข้อมูลวันนี้ --- */}
              <View style={stylesHome.table}>
                <View style={[stylesHome.row, stylesHome.header]}>
                  <Text style={[stylesHome.cell, stylesHome.headerText]}>วันที่</Text>
                  <Text style={[stylesHome.cell, stylesHome.headerText]}>เปิด</Text>
                  <Text style={[stylesHome.cell, stylesHome.headerText]}>ปิด</Text>
                  <Text style={[stylesHome.cell, stylesHome.headerText]}>ละลายน้ำแข็ง</Text>
                </View>
                {todayData.map((item, idx) => (
                  <View key={idx} style={stylesHome.row}>
                    <Text style={[stylesHome.cell, stylesHome.dateCell]}>
                      {formatDate(item[0])}
                    </Text>
                    <Text style={[stylesHome.cell, stylesHome.onCell]}>
                      {formatTime(item[1])}
                    </Text>
                    <Text style={[stylesHome.cell, stylesHome.offCell]}>
                      {formatTime(item[2])}
                    </Text>
                    <Text style={[stylesHome.cell, {marginTop: 15}]}>{item[3]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* --- ปุ่ม Refresh --- */}
          <TouchableOpacity
            style={[stylesHome.button, { marginTop: 15, backgroundColor: "#26d970ff" }]}
            onPress={fetchToday}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={stylesHome.buttonText}> โหลดใหม่</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

//------------------ หน้า CheckData ------------------
function CheckDataScreen() {
  const [date, setDate] = useState(new Date());
  const [sheetName, setSheetName] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const getSheetName = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatTime = (datetime) => {
    if (!datetime) return "";
    const match = datetime.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : datetime;
  };

  const fetchCsv = async () => {
    if (!sheetName) return;
    setLoading(true);
    setError("");
    setData([]);
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      const res = await fetch(url);
      const text = await res.text();
      if (text.includes("DOCTYPE") || text.includes("error")) {
        setError("❌ ไม่พบชีต: " + sheetName);
        setData([]);
      } else {
        const parsed = Papa.parse(text, { header: false });
        setData(parsed.data.slice(1));
      }
    } catch (err) {
      setError("❌ เกิดข้อผิดพลาด");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Ionicons name="analytics" size={30} color="#18cd5bff" style={{ alignSelf: "center", marginBottom: 8 }} />
          <Text style={styles.title}>เช็คข้อมูลเครื่อง (วันเดียว)</Text>

          {Platform.OS === "web" ? (
            <TextInput
              style={styles.input}
              type="date"
              value={date.toISOString().split("T")[0]}
              onChange={(e) => {
                const selected = new Date(e.target.value);
                setDate(selected);
                setSheetName(getSheetName(selected));
              }}
            />
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={() => setShowPicker(true)}>
                <Text style={styles.buttonText}>เลือกวันที่: {formatDate(date)}</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  maximumDate={new Date()} // <<<<<< เพิ่มบรรทัดนี้
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                      setSheetName(getSheetName(selectedDate));
                    }
                  }}
                />
              )}
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={fetchCsv}>
            <Ionicons name="cloud-download" size={18} color="#fff" />
            <Text style={styles.buttonText}> ดึงข้อมูล</Text>
          </TouchableOpacity>

          {/* ปุ่ม Refresh กดได้ตลอด */}
          {sheetName ? (
            <TouchableOpacity style={[styles.button, { backgroundColor: "#000000ff"}]} onPress={fetchCsv}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.buttonText}> โหลดใหม่</Text>
            </TouchableOpacity>
          ) : null}

          {loading && <ActivityIndicator size="large" color="#22c55e" style={{ marginVertical: 15 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {data.length > 0 && (
            <View style={styles.table}>
              <View style={[styles.row, styles.header]}>
                <Text style={[styles.cell, styles.headerText]}>วันที่</Text>
                <Text style={[styles.cell, styles.headerText]}>เปิด</Text>
                <Text style={[styles.cell, styles.headerText]}>ปิด</Text>
                <Text style={[styles.cell, styles.headerText]}>ละลายน้ำแข็ง</Text>
              </View>
              {data.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.cell, styles.dateCell]}>
                    {item[0]?.split("-").reverse().join("/")}
                  </Text>
                  <Text style={[styles.cell, styles.onCell]}>
                    {formatTime(item[1])}
                  </Text>
                  <Text style={[styles.cell, styles.offCell]}>
                    {formatTime(item[2])}
                  </Text>
                  <Text style={styles.cell}>{item[3]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

//------------------ หน้า RangeData ------------------
function RangeDataScreen() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const getSheetName = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatTime = (datetime) => {
    if (!datetime) return "";
    const match = datetime.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : datetime;
  };

  const fetchRangeData = async () => {
    if (startDate > endDate) {
      setError("❌ วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด");
      setData([]);
      return;
    }

    setLoading(true);
    setError("");
    setData([]);

    let allData = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const sheetName = getSheetName(current);
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (!(text.includes("DOCTYPE") || text.includes("error"))) {
          const parsed = Papa.parse(text, { header: false });
          allData = allData.concat(parsed.data.slice(1));
        }
      } catch (err) {
        // ข้ามชีตที่ไม่มี
      }
      current.setDate(current.getDate() + 1);
    }

    if (allData.length === 0) {
      setError("❌ ไม่พบข้อมูลในช่วงวันที่นี้");
    }
    setData(allData);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Ionicons name="calendar" size={30} color="#22c55e" style={{ alignSelf: "center", marginBottom: 8 }} />
          <Text style={styles.title}>เช็คข้อมูลช่วงวัน</Text>

          {Platform.OS === "web" ? (
            <>
              <TextInput style={styles.input} type="date" value={startDate.toISOString().split("T")[0]} onChange={(e) => setStartDate(new Date(e.target.value))} />
              <TextInput style={styles.input} type="date" value={endDate.toISOString().split("T")[0]} onChange={(e) => setEndDate(new Date(e.target.value))} />
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.buttonText}>วันที่เริ่มต้น: {formatDate(startDate)}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()} // <<<<<< เพิ่มบรรทัดนี้
                  onChange={(e, selected) => {
                    setShowStartPicker(false);
                    if (selected) setStartDate(selected);
                  }}
                />
              )}

              <TouchableOpacity style={styles.button} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.buttonText}>วันที่สิ้นสุด: {formatDate(endDate)}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()} // <<<<<< เพิ่มบรรทัดนี้
                  onChange={(e, selected) => {
                    setShowEndPicker(false);
                    if (selected) setEndDate(selected);
                  }}
                />
              )}
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={fetchRangeData}>
            <Ionicons name="cloud-download" size={18} color="#fff" />
            <Text style={styles.buttonText}> ดึงข้อมูล</Text>
          </TouchableOpacity>

          {/* ปุ่ม Refresh กดได้ตลอด */}
          <TouchableOpacity style={[styles.button, { backgroundColor: "#000000ff" }]} onPress={fetchRangeData}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.buttonText}> โหลดใหม่</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#21cd60ff" style={{ marginVertical: 15 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {data.length > 0 && (
            <View style={styles.table}>
              <View style={[styles.row, styles.header]}>
                <Text style={[styles.cell, styles.headerText]}>วันที่</Text>
                <Text style={[styles.cell, styles.headerText]}>เปิด</Text>
                <Text style={[styles.cell, styles.headerText]}>ปิด</Text>
                <Text style={[styles.cell, styles.headerText]}>ละลายน้ำแข็ง</Text>
              </View>
              {data.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.cell, styles.dateCell]}>
                    {item[0]?.split("-").reverse().join("/")}
                  </Text>
                  <Text style={[styles.cell, styles.onCell]}>
                    {formatTime(item[1])}
                  </Text>
                  <Text style={[styles.cell, styles.offCell]}>
                    {formatTime(item[2])}
                  </Text>
                  <Text style={styles.cell}>{item[3]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
//------------------ หน้า Monthly ------------------
function MonthlyScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // หาวันแรก-วันสุดท้ายของเดือนที่เลือก
  const getMonthRange = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return { first, last };
  };

  // 👉 เพิ่มฟังก์ชัน formatTime
  const formatTime = (datetime) => {
    if (!datetime) return "";
    const match = datetime.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : datetime;
  };

  // ดึงข้อมูลทุกวันในเดือนนั้น
  const fetchMonthData = async () => {
    setLoading(true);
    setError("");
    setData([]);
    const { first, last } = getMonthRange(selectedMonth);
    let allData = [];
    let current = new Date(first);

    while (current <= last && current <= new Date()) {
      const sheetName = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (!(text.includes("DOCTYPE") || text.includes("error"))) {
          const parsed = Papa.parse(text, { header: false });
          parsed.data.slice(1).forEach(row => {
            allData.push({ date: sheetName, ...row });
          });
        }
      } catch (err) {
        // ข้ามวันนั้น
      }
      current.setDate(current.getDate() + 1);
    }

    if (allData.length === 0) {
      setError("❌ ไม่พบข้อมูลในเดือนนี้");
    }
    setData(allData);
    setLoading(false);
  };

  // รวม d frost (ละลายน้ำแข็ง) ทั้งเดือน
  const sumDFrost = () => {
    let sum = 0;
    data.forEach(row => {
      const val = parseFloat(row[3]);
      if (!isNaN(val)) sum += val;
    });
    return sum;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
         <Ionicons 
          name="bar-chart" 
          size={30} 
           color="#0fb652ff" 
          style={{ alignSelf: "center", marginBottom: 8 }} 
          />

          <Text style={styles.title}>รายได้รายเดือน</Text>

          <TouchableOpacity style={styles.button} onPress={() => setShowPicker(true)}>
            <Text style={styles.buttonText}>
              เลือกเดือน: {selectedMonth.getMonth() + 1}/{selectedMonth.getFullYear()}
            </Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={selectedMonth}
              mode="date"
              display="calendar"
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowPicker(false);
                if (date) setSelectedMonth(date);
              }}
            />
          )}

          <TouchableOpacity style={styles.button} onPress={fetchMonthData}>
            <Ionicons name="cloud-download" size={18} color="#fff" />
            <Text style={styles.buttonText}> ดึงข้อมูล</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#f59e42" style={{ marginVertical: 15 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {data.length > 0 && (
            <>
              <View style={styles.table}>
                <View style={[styles.row, styles.header]}>
                  <Text style={[styles.cell, styles.headerText]}>วันที่</Text>
                  <Text style={[styles.cell, styles.headerText]}>เปิด</Text>
                  <Text style={[styles.cell, styles.headerText]}>ปิด</Text>
                  <Text style={[styles.cell, styles.headerText]}>ละลายน้ำแข็ง</Text>
                </View>
                {data.map((item, idx) => (
                  <View key={idx} style={styles.row}>
                    <Text style={[styles.cell, styles.dateCell]}>
                      {item.date?.split("-").reverse().join("/")}
                    </Text>
                    {/* 👉 ใช้ formatTime ที่นี่ */}
                    <Text style={[styles.cell, styles.onCell]}>{formatTime(item[1])}</Text>
                    <Text style={[styles.cell, styles.offCell]}>{formatTime(item[2])}</Text>
                    <Text style={styles.cell}>{item[3]}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ marginTop: 20, fontSize: 18, color: "#f59e42", fontFamily: "Kanit_500Medium", textAlign: "center" }}>
                รวม d frost ทั้งเดือน: {sumDFrost()}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


//------------------ Stack Navigator ------------------
export default function App() {
  let [fontsLoaded] = useFonts({ 
    Kanit_400Regular, 
    Kanit_500Medium 
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ marginTop: 10, fontFamily: "Kanit_400Regular" }}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#10151c", borderTopColor: "#1aff7c",fontFamily: "Kanit_400Regular" },
        tabBarActiveTintColor: "#1aff7c",
        tabBarInactiveTintColor: "#fff",
      }}
    >
      <Tab.Screen 
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "หน้าหลัก",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={22} />
          ),
        }}
      />
      <Tab.Screen style={{ fontFamily: "Kanit_400Regular" }}
        name="CheckData"
        component={CheckDataScreen}
        options={{
          tabBarLabel: "วันเดียว",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics" color={color} size={22} />
          ),
        }}
      />
      <Tab.Screen style={{ fontFamily: "Kanit_400Regular" }}
        name="RangeData"
        component={RangeDataScreen}
        options={{
          tabBarLabel: "ช่วงวัน",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Monthly"
        component={MonthlyScreen}
        options={{
          tabBarLabel: "รายเดือน",
          tabBarIcon: ({ color, size }) => (
             <Ionicons name="bar-chart" color={color} size={22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


//------------------ Styles for Home Screen ------------------
const stylesHome = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9fafb", // modern soft bg
  },
  logo: {
    width: 60,
    height: 40,
    alignSelf: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontFamily: "Kanit_500Medium",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Kanit_400Regular",
    color: "#242424ff",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 35,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17c961ff", // blue modern
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginHorizontal: 6,
    shadowColor: "#000",
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Kanit_500Medium",
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Kanit_500Medium",
    color: "#000000be",
    marginBottom: 12,
  },
  errorText: {
    color: "#dc2626",
    fontFamily: "Kanit_400Regular",
    textAlign: "center",
    marginVertical: 12,
  },
  table: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ffffffff",
  },
  row: {
    flexDirection: "row",
  },
  header: {
    backgroundColor: "#000000ff", // green header
  },
  headerText: {
    color: "#fff",
    fontFamily: "Kanit_500Medium",
    fontSize: 15,
    padding: 10,
    textAlign: "center",
    flex: 1,
  },
  cell: {
    flex: 1,
    padding: 12,
    borderColor: "#ffffffff",
    borderWidth: -0.1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Kanit_400Regular",
    color: "#374151",
  },
  dateCell: {
    backgroundColor: "#ecfdf5",
  },
  onCell: {
    backgroundColor: "#ffffffff",
  },
  offCell: {
    backgroundColor: "#ffffffff",
  },
});


//------------------ Styles for CheckData & RangeData ------------------
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#000",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    fontFamily: "Kanit_500Medium",
    color: "#111827",
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginVertical: 10,
    fontFamily: "Kanit_400Regular",
    fontSize: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17c961ff", // emerald modern
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginVertical: 10,
    justifyContent: "center",
    shadowColor: "#000",
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Kanit_500Medium",
    fontSize: 16,
    marginLeft: 8,
  },
  error: {
    color: "#ef4444",
    textAlign: "center",
    fontFamily: "Kanit_400Regular",
    marginVertical: 12,
  },
  table: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  row: {
    flexDirection: "row",
  },
  header: {
    backgroundColor: "#000000ff", // modern blue
  },
  headerText: {
    color: "#fff",
    fontFamily: "Kanit_500Medium",
    fontSize: 15,
    padding: 10,
    textAlign: "center",
    flex: 1,
  },
  cell: {
    flex: 1,
    padding: 12,
    borderColor: "#e5e7eb",
    borderWidth: 0.5,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Kanit_400Regular",
    color: "#374151",
  },
  dateCell: {
    backgroundColor: "#ffffffff",
  },
  onCell: {
    backgroundColor: "#ffffffff",
  },
  offCell: {
    backgroundColor: "#ffffffff",
  },

    


});

// สไตล์สำหรับโฆษณา
const stylesAd = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    width: 320,
    height: 500,
    shadowColor: "#000",
    elevation: 10,
  },
  image: {
    width: 960,
    height: 400,
    marginBottom: 18,
    borderRadius: 12,
  },
  button: {
    backgroundColor: "#17c961ff",
    borderRadius: 90,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 5,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Kanit_500Medium",
    fontSize: 16,
  },
});
