/**
 * แอพพลิเคชั่นสำหรับดูข้อมูลเครื่องจักรจาก Google Sheets
 * 
 * การ import libraries ที่จำเป็น:
 * - React: ใช้สร้าง UI Components และจัดการ state
 * - React Native: ใช้สร้าง Native Components สำหรับ iOS/Android
 * - Expo: ใช้ tools และ services สำหรับพัฒนาแอพ
 */
// import React และ hooks พื้นฐานที่ใช้จัดการ state และ lifecycle
import React, { useState, useEffect } from "react";

// import Expo Updates สำหรับอัพเดทแอพแบบ Over-the-Air (OTA)
import * as Updates from 'expo-updates';

// import Components พื้นฐานจาก React Native
import {
  View,        // ใช้จัดวาง layout แบบ flex
  Text,        // ใช้แสดงข้อความ
  StyleSheet,  // ใช้จัดการ styles
  Animated,    // ใช้สำหรับ animations
  ScrollView,  // ใช้สร้าง scrollable content
  TouchableOpacity,  // ปุ่มกดที่มี feedback
  ActivityIndicator, // ตัวแสดง loading
  Platform,    // ตรวจสอบ platform (iOS/Android)
  TextInput,   // ช่องกรอกข้อความ
  KeyboardAvoidingView,  // จัดการ keyboard ไม่ให้บังเนื้อหา
  Image,       // แสดงรูปภาพ
  Modal,       // หน้าต่าง popup
  Alert,       // แจ้งเตือนแบบ native
  Dimensions,  // ใช้ตรวจสอบขนาดหน้าจอ
  RefreshControl, // สำหรับ pull-to-refresh
} from "react-native";

// import AsyncStorage สำหรับเก็บข้อมูลแบบ local storage
// เหมือน localStorage ใน web แต่เป็นแบบ async
import AsyncStorage from '@react-native-async-storage/async-storage';

// import PapaParse สำหรับแปลงข้อมูล CSV เป็น JSON
import Papa from "papaparse";

// import Navigation libraries
import { NavigationContainer } from "@react-navigation/native";  // ควบคุมการ navigate ทั้งแอพ
import { createNativeStackNavigator } from "@react-navigation/native-stack";  // สร้าง stack navigation
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";  // สร้าง tab navigation

// import Ionicons สำหรับใช้ icons
import { Ionicons } from '@expo/vector-icons';

// import fonts Kanit
// useFonts hook ใช้โหลดและตรวจสอบสถานะ font
import { useFonts, Kanit_400Regular, Kanit_500Medium, Kanit_600SemiBold } from "@expo-google-fonts/kanit";

// import DateTimePicker สำหรับเลือกวันที่แบบ native
import DateTimePicker from "@react-native-community/datetimepicker";

// import สำหรับ export ไฟล์
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

/**
 * Constants & Configurations
 * กำหนดค่าคงที่ต่างๆ ที่ใช้ในแอพ
 */

// Keys สำหรับเก็บข้อมูลใน AsyncStorage
// ใส่ @ นำหน้าเพื่อป้องกันการชนกันของ keys ตามแนวทางของ React Native
const SHEET_ID_KEY = '@sheet_id';    // เก็บ ID ของ Google Sheet
const USERNAME_KEY = '@username';     // เก็บชื่อผู้ใช้
const LANGUAGE_KEY = '@language';     // เก็บการตั้งค่าภาษา

// ค่าเริ่มต้นต่างๆ
const DEFAULT_LANGUAGE = 'th';        // กำหนดภาษาเริ่มต้นเป็นภาษาไทย

/**
 * ข้อความแปลภาษาต่างๆ ในแอพ
 * ใช้รูปแบบ Object ที่มี key เป็นรหัสภาษา (th, en)
 * และ value เป็น Object ของข้อความในภาษานั้นๆ
 */
const translations = {
  th: {
    welcome: 'ยินดีต้อนรับ',
    summary: 'สรุปกิจกรรม',
    settingsTitle: 'ตั้งค่า Sheet ID',
    settingsSubtitle: 'กรอก ID ของ Google Sheet ที่ต้องการเชื่อมต่อ',
    usernameTitle: 'ตั้งชื่อผู้ใช้',
    usernameSubtitle: 'กรุณากรอกชื่อภาษาไทยหรืออังกฤษที่ต้องการใช้',
    usernamePlaceholder: 'กรอกชื่อของคุณ',
    usernameError: 'กรุณากรอกชื่อผู้ใช้',
    save: 'บันทึก',
    loading: 'กำลังโหลด...',
    noData: 'ไม่พบข้อมูล',
    error: 'เกิดข้อผิดพลาด',
    success: 'สำเร็จ',
    errorMessage: 'ไม่สามารถบันทึกได้',
    savedSuccess: 'บันทึกเรียบร้อยแล้ว',
    pleaseEnter: 'กรุณากรอกข้อมูล',
    language: 'ภาษา',
    thai: 'ไทย',
    english: 'English',
    pullToRefresh: 'ดึงลงเพื่อรีเฟรช',
    refreshing: 'กำลังรีเฟรช...',
    exportExcel: 'ส่งออก Excel',
    exportPDF: 'ส่งออก PDF',
    printReport: 'พิมพ์รายงาน',
    exportSuccess: 'ส่งออกไฟล์สำเร็จ',
    exportError: 'ไม่สามารถส่งออกไฟล์ได้',
    generatingReport: 'กำลังสร้างรายงาน...',
    chart: 'กราฟ',
    chartTitle: 'กราฟแสดงข้อมูล',
    dailyReport: 'รายงานรายวัน',
    rangeReport: 'รายงานช่วงวันที่',
    monthlyReport: 'รายงานรายเดือน',
    exportOptions: 'ตัวเลือกการส่งออก',
  },
  en: {
    welcome: 'Welcome',
    summary: 'Here\'s your activity summary',
    settingsTitle: 'Sheet ID Settings',
    settingsSubtitle: 'Enter the Google Sheet ID to connect',
    usernameTitle: 'Set Username',
    usernameSubtitle: 'Please enter your preferred username',
    save: 'Save',
    loading: 'Loading...',
    noData: 'No data found',
    error: 'Error',
    success: 'Success',
    errorMessage: 'Unable to save',
    savedSuccess: 'Saved successfully',
    pleaseEnter: 'Please enter data',
    language: 'Language',
    thai: 'Thai',
    english: 'English',
    pullToRefresh: 'Pull to refresh',
    refreshing: 'Refreshing...',
    exportExcel: 'Export Excel',
    exportPDF: 'Export PDF',
    printReport: 'Print Report',
    exportSuccess: 'Export successful',
    exportError: 'Unable to export file',
    generatingReport: 'Generating report...',
    chart: 'Chart',
    chartTitle: 'Data Chart',
    dailyReport: 'Daily Report',
    rangeReport: 'Date Range Report',
    monthlyReport: 'Monthly Report',
    exportOptions: 'Export Options',
  }
};

/**
 * Default Configuration & Navigation Setup
 */

// Google Sheet ID เริ่มต้น (สามารถเปลี่ยนได้ผ่านการตั้งค่า)
const DEFAULT_SHEET_ID = "199jXO_ysskOBTksEaLsg9f4FwHBGy5svl3lTWAoHaDI";

// สร้าง Navigator objects สำหรับการนำทางในแอพ
const Stack = createNativeStackNavigator();  // ใช้สำหรับ stack navigation (push/pop screens)
const Tab = createBottomTabNavigator();      // ใช้สำหรับ bottom tab navigation

// Utility Functions
const exportToExcel = async (data, filename, headers, language) => {
  try {
    // สร้าง CSV content
    let csvContent = '';
    
    // เพิ่ม headers
    if (headers && headers.length > 0) {
      csvContent += headers.join(',') + '\n';
    }
    
    // เพิ่มข้อมูล
    data.forEach(row => {
      const rowData = Array.isArray(row) ? row : Object.values(row);
      const escapedRow = rowData.map(field => {
        // Escape commas and quotes
        const fieldStr = String(field || '');
        if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
          return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        return fieldStr;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    // สร้างไฟล์
    const fileUri = FileSystem.documentDirectory + filename;
    
    // เขียนไฟล์
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // แชร์ไฟล์
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `${translations[language].exportExcel} - ${filename}`,
    });

    Alert.alert(translations[language].success, translations[language].exportSuccess);
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert(translations[language].error, translations[language].exportError);
  }
};

const generateHTMLReport = (data, title, headers) => {
  const tableRows = data.map(row => {
    const cells = Array.isArray(row) ? row : Object.values(row);
    return `
      <tr>
        ${cells.map(cell => `<td>${cell || ''}</td>`).join('')}
      </tr>
    `;
  }).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Kanit', sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #333; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: center; }
          .table th { background-color: #00D26B; color: white; font-weight: bold; }
          .table tr:nth-child(even) { background-color: #f8f9fa; }
          .summary { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div>Generated on: ${new Date().toLocaleDateString()}</div>
        </div>
        <table class="table">
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="summary">
          <strong>Summary:</strong> Total ${data.length} records
        </div>
      </body>
    </html>
  `;
};

const exportToPDF = async (data, title, headers, language) => {
  try {
    const html = generateHTMLReport(data, title, headers);
    const { uri } = await Print.printToFileAsync({ html });
    
    const pdfFilename = `${title.replace(/ /g, '_')}.pdf`;
    const newUri = FileSystem.documentDirectory + pdfFilename;
    
    await FileSystem.moveAsync({
      from: uri,
      to: newUri
    });

    await Sharing.shareAsync(newUri, {
      mimeType: 'application/pdf',
      dialogTitle: `${translations[language].exportPDF} - ${title}`,
    });

    Alert.alert(translations[language].success, translations[language].exportSuccess);
  } catch (error) {
    console.error('PDF export error:', error);
    Alert.alert(translations[language].error, translations[language].exportError);
  }
};

/**
 * HomeScreen Component
 * หน้าหลักของแอพ แสดงข้อมูลสรุปและปุ่มนำทางไปยังหน้าต่างๆ
 */
function HomeScreen({ navigation, sheetId, setSheetId }) {
  // State Management ใช้ useState Hook จัดการข้อมูลที่มีการเปลี่ยนแปลง
  
  // ข้อมูลหลัก
  const [todayData, setTodayData] = useState([]); // เก็บข้อมูลที่ดึงมาจาก Sheet
  const [error, setError] = useState("");         // เก็บข้อความ error (ถ้ามี)
  
  // การตั้งค่าภาษา
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE); // ภาษาปัจจุบัน
  const [showLanguage, setShowLanguage] = useState(false);   // แสดง/ซ่อน modal ภาษา
  
  // สถานะการโหลด
  const [loading, setLoading] = useState(true);    // แสดงสถานะกำลังโหลดข้อมูล
  
  // สถานะการแสดง Modal และ Dropdown
  const [showAd, setShowAd] = useState(true);           // Modal โฆษณา
  const [showSettings, setShowSettings] = useState(false); // Modal ตั้งค่า
  const [showUsername, setShowUsername] = useState(false); // Modal ตั้งชื่อ
  const [showDropdown, setShowDropdown] = useState(false); // Dropdown menu
  
  // Animation values
  const dropdownAnimation = useState(new Animated.Value(0))[0];
  const dateMenuAnimation = useState(new Animated.Value(0))[0];
  const [showDateMenu, setShowDateMenu] = useState(false);
  
  // ข้อมูลชั่วคราวสำหรับการตั้งค่า
  const [tempSheetId, setTempSheetId] = useState("");     // Sheet ID ที่กำลังแก้ไข
  const [username, setUsername] = useState("");            // ชื่อผู้ใช้ปัจจุบัน
  const [tempUsername, setTempUsername] = useState("");    // ชื่อผู้ใช้ที่กำลังแก้ไข

  // เพิ่ม state สำหรับ pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Load language
  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  // Animation functions
  useEffect(() => {
    if (showDateMenu) {
      Animated.spring(dateMenuAnimation, {
        toValue: 1,
        damping: 12,
        mass: 0.8,
        stiffness: 100,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(dateMenuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [showDateMenu]);

  const toggleDropdown = () => {
    if (showDropdown) {
      // Hide dropdown
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => setShowDropdown(false));
    } else {
      setShowDropdown(true);
      Animated.spring(dropdownAnimation, {
        toValue: 1,
        damping: 12,
        mass: 0.8,
        stiffness: 100,
        useNativeDriver: true
      }).start();
    }
  };

  // Save language
  const saveLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguage(lang);
      setShowLanguage(false);
      Alert.alert(
        translations[lang].success,
        translations[lang].savedSuccess
      );
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert(
        translations[language].error,
        translations[language].errorMessage
      );
    }
  };

  // Load username
  const loadUsername = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  // Save username
  const saveUsername = async (name) => {
    try {
      await AsyncStorage.setItem(USERNAME_KEY, name);
      setUsername(name);
      Alert.alert('สำเร็จ', 'บันทึกชื่อผู้ใช้เรียบร้อยแล้ว!');
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกชื่อผู้ใช้ได้');
    }
  };

  // Handle username save
  const handleSaveUsername = () => {
    if (tempUsername.trim()) {
      saveUsername(tempUsername.trim());
      setShowUsername(false);
    } else {
      Alert.alert(translations[language].error, translations[language].usernameError);
    }
  };
  
  const getTodaySheet = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatTime = (datetime) => {
    if (!datetime) return "";
    const match = datetime.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : datetime;
  };

  const fetchToday = async () => {
    const sheetName = getTodaySheet();
    try {
      setLoading(true);
      setError("");
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      const res = await fetch(url);
      const text = await res.text();

      if (text.includes("DOCTYPE") || text.includes("error")) {
        setTodayData([]);
        setError("❌ ไม่พบข้อมูลของวันนี้");
        return;
      }

      const parsed = Papa.parse(text, { header: false });
      setTodayData(parsed.data.slice(1));
    } catch (err) {
      setTodayData([]);
      setError("❌ ไม่พบข้อมูลของวันนี้");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับดึงข้อมูลเมื่อ pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchToday();
    setRefreshing(false);
  };

  // Load saved Sheet ID
  const loadSheetId = async () => {
    try {
      const savedId = await AsyncStorage.getItem(SHEET_ID_KEY);
      if (savedId) {
        setSheetId(savedId);
      }
    } catch (error) {
      console.error('Error loading Sheet ID:', error);
    }
  };

  // Save Sheet ID
  const saveSheetId = async (id) => {
    try {
      await AsyncStorage.setItem(SHEET_ID_KEY, id);
      setSheetId(id);
      Alert.alert('สำเร็จ', 'บันทึก Sheet ID เรียบร้อยแล้ว!');
    } catch (error) {
      console.error('Error saving Sheet ID:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึก Sheet ID ได้');
    }
  };

  // แปลง URL เป็น Sheet ID
  const extractSheetId = (input) => {
    try {
      if (input.includes('spreadsheets')) {
        const matches = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return matches ? matches[1] : input;
      }
      return input.trim();
    } catch (error) {
      return input.trim();
    }
  };

  // Handle settings save
  const handleSaveSettings = () => {
    if (tempSheetId.trim()) {
      const extractedId = extractSheetId(tempSheetId.trim());
      saveSheetId(extractedId);
      setShowSettings(false);
      fetchToday(); // ดึงข้อมูลทันทีหลังบันทึก Sheet ID
    } else {
      Alert.alert('ผิดพลาด', 'กรุณากรอก Sheet ID หรือ URL');
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedId = await AsyncStorage.getItem(SHEET_ID_KEY);
        if (!savedId) {
          setShowSettings(true); // แสดง Settings Modal ถ้ายังไม่มี Sheet ID
        } else {
          setSheetId(savedId);
          setShowAd(true);
        }
      } catch (error) {
        console.error('Error loading Sheet ID:', error);
        setShowSettings(true);
      }
      loadUsername();
      loadLanguage();
    };

    initApp();
  }, []);

  useEffect(() => {
    fetchToday();
  }, [sheetId]);

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // ฟังก์ชันคำนวณข้อมูลสรุป
  const getStats = () => {
    if (todayData.length === 0) {
      return {
        records: '0',
        firstStartTime: '--:--',
        lastEndTime: '--:--',
        totalFreeze: '0',
        totalFreezeTime: '0h',
        avgFreeze: '0',
        runtime: '0'
      };
    }

    // จำนวน records
    const records = todayData.length;

    // เวลาเริ่มแรกสุด
    const firstStartTime = todayData[0][1] ? formatTime(todayData[0][1]) : '--:--';
    
    // เวลาจบล่าสุด
    const lastEndTime = todayData[todayData.length - 1][2] ? formatTime(todayData[todayData.length - 1][2]) : '--:--';
    
    // รวม freeze (ละลายน้ำแข็ง)
    const totalFreeze = todayData.reduce((sum, row) => {
      const freeze = parseFloat(row[3]) || 0;
      return sum + freeze;
    }, 0);

    // ค่าเฉลี่ย freeze
    const avgFreeze = (totalFreeze / records).toFixed(1);

    // รวม freeze time
    const totalFreezeTime = todayData.reduce((sum, row) => {
      const freezeTime = parseFloat(row[4]) || 0;
      return sum + freezeTime;
    }, 0);

    // ดึง runtime จากคอลัมน์ Time ล่าสุด
    let runtime = '0';
    if (todayData.length > 0) {
      const lastTime = todayData[todayData.length - 1][4];
      // ตัด h ออกถ้ามี และใช้แค่ตัวเลข
      runtime = lastTime ? lastTime.replace('h', '') : '0';
    }

    return {
      records: records.toString(),
      firstStartTime,
      lastEndTime,
      totalFreeze: totalFreeze.toFixed(1),
      totalFreezeTime: `${totalFreezeTime.toFixed(1)}h`,
      avgFreeze,
      runtime
    };
  };

  const stats = getStats();

  return (
    <>
      {/* --- Pop-up โฆษณา --- */}
      <Modal
        visible={showAd}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAd(false)}
      >
        <View style={stylesAd.overlay}>
          <View style={stylesAd.popup}>
            <TouchableOpacity
              style={stylesAd.closeButton}
              onPress={() => setShowAd(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            
            <Image
              source={require("./assets/ORING.png")}
              style={stylesAd.image}
              resizeMode="contain"
            />
            
            <Text style={stylesAd.title}>ยินดีต้อนรับ</Text>
            <Text style={stylesAd.subtitle}>
              SCCE APP V.1.0.0
            </Text>
            
            <TouchableOpacity
              style={stylesAd.startButton}
              onPress={() => setShowAd(false)}
            >
              <Text style={stylesAd.startButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- Settings Modal --- */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={stylesAd.overlay}>
          <View style={stylesAd.popup}>
            <TouchableOpacity
              style={stylesAd.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={stylesAd.title}>ตั้งค่า Sheet ID</Text>
            <Text style={stylesAd.subtitle}>
              กรอก ID ของ Google Sheet ที่ต้องการเชื่อมต่อ
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E0E0E0',
                borderRadius: 10,
                padding: 15,
                marginBottom: 20,
                fontFamily: 'Kanit_400Regular',
                fontSize: 16,
              }}
              value={tempSheetId}
              onChangeText={setTempSheetId}
              placeholder="กรอก Sheet ID"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={stylesAd.startButton}
              onPress={handleSaveSettings}
            >
              <Text style={stylesAd.startButtonText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- Language Modal --- */}
      <Modal
        visible={showLanguage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguage(false)}
      >
        <View style={stylesAd.overlay}>
          <View style={stylesAd.popup}>
            <TouchableOpacity
              style={stylesAd.closeButton}
              onPress={() => setShowLanguage(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={stylesAd.title}>{translations[language].language}</Text>

            <TouchableOpacity
              style={[stylesAd.languageButton, language === 'th' && stylesAd.languageButtonActive]}
              onPress={() => saveLanguage('th')}
            >
              <Text style={[stylesAd.languageButtonText, language === 'th' && stylesAd.languageButtonTextActive]}>
                {translations[language].thai}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[stylesAd.languageButton, language === 'en' && stylesAd.languageButtonActive]}
              onPress={() => saveLanguage('en')}
            >
              <Text style={[stylesAd.languageButtonText, language === 'en' && stylesAd.languageButtonTextActive]}>
                {translations[language].english}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- Username Modal --- */}
      <Modal
        visible={showUsername}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUsername(false)}
      >
        <View style={stylesAd.overlay}>
          <View style={stylesAd.popup}>
            <TouchableOpacity
              style={stylesAd.closeButton}
              onPress={() => setShowUsername(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={stylesAd.title}>{translations[language].usernameTitle}</Text>
            <Text style={stylesAd.subtitle}>
              {translations[language].usernameSubtitle}
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E0E0E0',
                borderRadius: 10,
                padding: 15,
                marginBottom: 20,
                fontFamily: 'Kanit_400Regular',
                fontSize: 16,
              }}
              value={tempUsername}
              onChangeText={setTempUsername}
              placeholder={translations[language].usernamePlaceholder}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={stylesAd.startButton}
              onPress={handleSaveUsername}
            >
              <Text style={stylesAd.startButtonText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- เนื้อหา Home --- */}
      <View style={stylesHome.container}>
        {/* --- Header --- */}
        <View style={stylesHome.header}>
          <View style={stylesHome.headerTop}>
            <View style={stylesHome.logoContainer}>
              <Image 
                source={require("./assets/SCCE_logo-i.png")} 
                style={stylesHome.logo} 
                resizeMode="contain"
              />
              <Text style={stylesHome.appTitle}>SCCE SOULUTION</Text>
            </View>
            <View style={stylesHome.headerButtons}>
              <TouchableOpacity 
                style={stylesHome.settingsButton}
                onPress={toggleDropdown}
              >
                <Ionicons name="menu-outline" size={24} color="#333" />
              </TouchableOpacity>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <TouchableOpacity 
                    style={stylesHome.dropdownOverlay}
                    activeOpacity={1}
                    onPress={toggleDropdown}
                  />
                  <Animated.View 
                    style={[
                      stylesHome.dropdownMenu,
                      {
                        opacity: dropdownAnimation,
                        transform: [{
                          scale: dropdownAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1]
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity 
                      style={stylesHome.dropdownItem}
                      onPress={() => {
                        toggleDropdown();
                        setShowLanguage(true);
                      }}
                    >
                      <Ionicons name="language-outline" size={20} color="#00D26B" />
                      <Text style={stylesHome.dropdownText}>เปลี่ยนภาษา</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={stylesHome.dropdownItem}
                      onPress={() => {
                        toggleDropdown();
                        setTempUsername(username);
                        setShowUsername(true);
                      }}
                    >
                      <Ionicons name="person-outline" size={20} color="#00D26B" />
                      <Text style={stylesHome.dropdownText}>ตั้งชื่อผู้ใช้</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={stylesHome.dropdownItem}
                      onPress={() => {
                        toggleDropdown();
                        setTempSheetId(sheetId); 
                        setShowSettings(true);
                      }}
                    >
                      <Ionicons name="settings-outline" size={20} color="#00D26B" />
                      <Text style={stylesHome.dropdownText}>ตั้งค่า Sheet ID</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </View>
          </View>
          
          <View style={stylesHome.headerBottom}>
            <View>
              <Text style={stylesHome.welcomeText}>{translations[language].welcome}, {username || 'User'}</Text>
              <Text style={stylesHome.summaryText}>{translations[language].summary}</Text>
            </View>
            <View style={stylesHome.headerActionButtons}>
              <TouchableOpacity 
                style={[stylesHome.settingsButton, { backgroundColor: '#00D26B' }]}
                onPress={fetchToday}
              >
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[stylesHome.settingsButton, { backgroundColor: '#F8F9FA' }]}
                onPress={() => setShowDateMenu(!showDateMenu)}
              >
                <Ionicons name="filter-outline" size={24} color="#333" />
              </TouchableOpacity>
              
              {/* Date Menu Dropdown */}
              {showDateMenu && (
                <>
                  <TouchableOpacity 
                    style={stylesHome.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDateMenu(false)}
                  />
                  <Animated.View 
                    style={[
                      stylesHome.dateMenuDropdown,
                      {
                        transform: [{
                          scale: dateMenuAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1]
                          })
                        }],
                        opacity: dateMenuAnimation
                      }
                    ]}
                  >
                    <TouchableOpacity 
                      style={[stylesHome.dropdownItem, { backgroundColor: '#F8FFF8' }]}
                      onPress={() => {
                        setShowDateMenu(false);
                        navigation.navigate('CheckData');
                      }}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#00D26B" />
                      <Text style={[stylesHome.dropdownText, { color: '#00D26B' }]}>เลือกวันเดียว</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[stylesHome.dropdownItem, { backgroundColor: '#FFF8F8' }]}
                      onPress={() => {
                        setShowDateMenu(false);
                        navigation.navigate('RangeData');
                      }}
                    >
                      <Ionicons name="calendar" size={20} color="#FF6B6B" />
                      <Text style={[stylesHome.dropdownText, { color: '#FF6B6B' }]}>เลือกช่วงวันที่</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Main Content with ScrollView */}
        <ScrollView 
          style={stylesHome.scrollView}
          contentContainerStyle={stylesHome.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00D26B']}
              tintColor="#00D26B"
              title={translations[language].pullToRefresh}
              titleColor="#666"
            />
          }
        >
          {/* --- Today's Data Section --- */}
          <Text style={stylesHome.sectionTitle}>Today's Data</Text>
          
          {/* --- Recent Data Table --- */}
          {!loading && todayData.length > 0 && (
            <View style={stylesHome.tableContainer}>
              <Text style={stylesHome.tableTitle}>Recent Data</Text>
              <View style={stylesHome.table}>
                <View style={stylesHome.tableHeader}>
                  <Text style={stylesHome.headerCell}>Date</Text>
                  <Text style={stylesHome.headerCell}>ON</Text>
                  <Text style={stylesHome.headerCell}>OFF</Text>
                  <Text style={stylesHome.headerCell}>D-Frost</Text>
                  <Text style={stylesHome.headerCell}>Freeze Time</Text>
                </View>
                {todayData.slice(0, 3).map((item, idx) => (
                  <View key={idx} style={stylesHome.tableRow}>
                    <Text style={stylesHome.tableCell}>
                      {formatDate(item[0])}
                    </Text>
                    <Text style={stylesHome.tableCell}>
                      {formatTime(item[1])}
                    </Text>
                    <Text style={stylesHome.tableCell}>
                      {formatTime(item[2])}
                    </Text>
                    <Text style={stylesHome.tableCell}>{item[3]}</Text>
                    <Text style={stylesHome.tableCell}>{item[4]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* --- Stats Grid --- */}
          <View style={stylesHome.statsGrid}>
            {/* Row 1 */}
            <View style={stylesHome.statsRow}>
              <View style={stylesHome.statCard}>
                <Text style={stylesHome.statLabel}>Records</Text>
                <Text style={stylesHome.statValue}>{stats.records}</Text>
              </View>
              <View style={stylesHome.statCard}>
                <Text style={stylesHome.statLabel}>Current Time</Text>
                <Text style={stylesHome.statValue}>{getCurrentTime()}</Text>
              </View>
            </View>
            
            {/* Row 2 */}
            <View style={stylesHome.statsRow}>
              <View style={stylesHome.statCard}>
                <Text style={stylesHome.statLabel}>ON</Text>
                <Text style={stylesHome.statValue}>{stats.firstStartTime}</Text>
              </View>
              <View style={stylesHome.statCard}>
                <Text style={stylesHome.statLabel}>OFF</Text>
                <Text style={stylesHome.statValue}>{stats.lastEndTime}</Text>
              </View>
            </View>
            
            {/* Row 3 */}
            <View style={stylesHome.statsRow}>
              <View style={stylesHome.statCard}>
                <Text style={stylesHome.statLabel}>Total D-Frost</Text>
                <Text style={stylesHome.statValue}>{stats.totalFreeze}</Text>
              </View>
              <View style={stylesHome.statCard}>
                <Text style={stylesHome.statLabel}>Freeze Time</Text>
                <Text style={stylesHome.statValue}>{stats.runtime}</Text>
              </View>
            </View>
          </View>

          {/* --- Loading State --- */}
          {loading && (
            <View style={stylesHome.loadingContainer}>
              <ActivityIndicator size="large" color="#00D26B" />
              <Text style={stylesHome.loadingText}>Loading data...</Text>
            </View>
          )}

          {/* --- Error State --- */}
          {!loading && error ? (
            <View style={stylesHome.errorContainer}>
              <Text style={stylesHome.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Bottom padding for better scrolling */}
          <View style={stylesHome.bottomPadding} />
        </ScrollView>
      </View>
    </>
  );
}

//--- CheckDataScreen ---
function CheckDataScreen({ sheetId }) {
  const [date, setDate] = useState(new Date());
  const [sheetName, setSheetName] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportAnimation = useState(new Animated.Value(0))[0];

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
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      const res = await fetch(url);
      const text = await res.text();
      if (text.includes("DOCTYPE") || text.includes("error")) {
        setError("❌ No data found for: " + sheetName);
        setData([]);
      } else {
        const parsed = Papa.parse(text, { header: false });
        setData(parsed.data.slice(1));
      }
    } catch (err) {
      setError("❌ Error occurred");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCsv();
    setRefreshing(false);
  };

  const toggleExportDropdown = () => {
    if (showExportDropdown) {
      Animated.timing(exportAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => setShowExportDropdown(false));
    } else {
      setShowExportDropdown(true);
      Animated.spring(exportAnimation, {
        toValue: 1,
        damping: 12,
        mass: 0.8,
        stiffness: 100,
        useNativeDriver: true
      }).start();
    }
  };

  const handleExportExcel = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const exportData = data.map(item => [
      item[0]?.split("-").reverse().join("/") || '',
      formatTime(item[1]) || '',
      formatTime(item[2]) || '',
      item[3] || '',
      item[4] || ''
    ]);

    const filename = `daily_report_${sheetName}.csv`;
    await exportToExcel(exportData, filename, headers, language);
    setShowExportDropdown(false);
  };

  const handleExportPDF = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const exportData = data.map(item => [
      item[0]?.split("-").reverse().join("/") || '',
      formatTime(item[1]) || '',
      formatTime(item[2]) || '',
      item[3] || '',
      item[4] || ''
    ]);

    const title = `${translations[language].dailyReport} - ${sheetName}`;
    await exportToPDF(exportData, title, headers, language);
    setShowExportDropdown(false);
  };

  const handlePrintReport = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const html = generateHTMLReport(
      data.map(item => [
        item[0]?.split("-").reverse().join("/") || '',
        formatTime(item[1]) || '',
        formatTime(item[2]) || '',
        item[3] || '',
        item[4] || ''
      ]),
      `${translations[language].dailyReport} - ${sheetName}`,
      headers
    );

    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert(translations[language].error, 'Cannot print report');
    }
    setShowExportDropdown(false);
  };

  // Load language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  return (
    <View style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Single Day Check</Text>
            <Text style={styles.headerSubtitle}>Check machine data for specific date</Text>
          </View>
          <View style={styles.headerActions}>
            {data.length > 0 && (
              <View style={styles.exportContainer}>
                <TouchableOpacity 
                  style={[styles.exportButton, { backgroundColor: '#00D26B' }]}
                  onPress={toggleExportDropdown}
                >
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.exportButtonText}>Export</Text>
                  <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                
                {/* Export Dropdown */}
                {showExportDropdown && (
                  <>
                    <TouchableOpacity 
                      style={styles.dropdownOverlay}
                      activeOpacity={1}
                      onPress={toggleExportDropdown}
                    />
                    <Animated.View 
                      style={[
                        styles.exportDropdown,
                        {
                          opacity: exportAnimation,
                          transform: [{
                            scale: exportAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.95, 1]
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={styles.exportDropdownTitle}>{translations[language].exportOptions}</Text>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#E8F5E8' }]}
                        onPress={handleExportExcel}
                      >
                        <Ionicons name="document-text-outline" size={20} color="#00D26B" />
                        <Text style={[styles.exportDropdownText, { color: '#00D26B' }]}>
                          {translations[language].exportExcel}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#FFEBEE' }]}
                        onPress={handleExportPDF}
                      >
                        <Ionicons name="document-outline" size={20} color="#FF6B6B" />
                        <Text style={[styles.exportDropdownText, { color: '#FF6B6B' }]}>
                          {translations[language].exportPDF}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#FFF3E0' }]}
                        onPress={handlePrintReport}
                      >
                        <Ionicons name="print-outline" size={20} color="#FF9800" />
                        <Text style={[styles.exportDropdownText, { color: '#FF9800' }]}>
                          {translations[language].printReport}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </>
                )}
                
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchCsv}
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D26B']}
            tintColor="#00D26B"
            title={translations[language].pullToRefresh}
            titleColor="#666"
          />
        }
      >
        <View style={styles.card}>
          {/* --- Date Picker --- */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Select Date</Text>
            {Platform.OS === "web" ? (
              <TextInput
                style={styles.dateInput}
                type="date"
                value={date.toISOString().split("T")[0]}
                onChange={(e) => {
                  const selected = new Date(e.target.value);
                  setDate(selected);
                  setSheetName(getSheetName(selected));
                }}
              />
            ) : (
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#00D26B" />
                <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
                <Ionicons name="chevron-down-outline" size={20} color="#666" />
              </TouchableOpacity>
            )}
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear(), 6, 14)}
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                    setSheetName(getSheetName(selectedDate));
                  }
                }}
              />
            )}
          </View>

          {/* --- Action Button --- */}
          <TouchableOpacity style={styles.fetchButton} onPress={fetchCsv}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.fetchButtonText}>Fetch Data</Text>
          </TouchableOpacity>

          {/* --- Loading State --- */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00D26B" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          )}

          {/* --- Error State --- */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* --- Data Table --- */}
          {data.length > 0 && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableTitle}>Data Results ({data.length} records)</Text>
              </View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>Date</Text>
                  <Text style={styles.headerCell}>ON</Text>
                  <Text style={styles.headerCell}>OFF</Text>
                  <Text style={styles.headerCell}>D-frost</Text>
                  <Text style={styles.headerCell}>Freeze Time</Text>
                </View>
                {data.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCell}>
                      {item[0]?.split("-").reverse().join("/")}
                    </Text>
                    <Text style={styles.tableCell}>
                      {formatTime(item[1])}
                    </Text>
                    <Text style={styles.tableCell}>
                      {formatTime(item[2])}
                    </Text>
                    <Text style={styles.tableCell}>{item[3]}</Text>
                    <Text style={styles.tableCell}>{item[4]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
}

//--- RangeDataScreen ---
function RangeDataScreen({ sheetId }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportAnimation = useState(new Animated.Value(0))[0];

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
      setError("❌ Start date must be before end date");
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
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (!(text.includes("DOCTYPE") || text.includes("error"))) {
          const parsed = Papa.parse(text, { header: false });
          allData = allData.concat(parsed.data.slice(1));
        }
      } catch (err) {
        // Skip missing sheets
      }
      current.setDate(current.getDate() + 1);
    }

    if (allData.length === 0) {
      setError("❌ No data found in this date range");
    }
    setData(allData);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRangeData();
    setRefreshing(false);
  };

  const toggleExportDropdown = () => {
    if (showExportDropdown) {
      Animated.timing(exportAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => setShowExportDropdown(false));
    } else {
      setShowExportDropdown(true);
      Animated.spring(exportAnimation, {
        toValue: 1,
        damping: 12,
        mass: 0.8,
        stiffness: 100,
        useNativeDriver: true
      }).start();
    }
  };

  const handleExportExcel = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const exportData = data.map(item => [
      item[0]?.split("-").reverse().join("/") || '',
      formatTime(item[1]) || '',
      formatTime(item[2]) || '',
      item[3] || '',
      item[4] || ''
    ]);

    const filename = `range_report_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`;
    await exportToExcel(exportData, filename, headers, language);
    setShowExportDropdown(false);
  };

  const handleExportPDF = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const exportData = data.map(item => [
      item[0]?.split("-").reverse().join("/") || '',
      formatTime(item[1]) || '',
      formatTime(item[2]) || '',
      item[3] || '',
      item[4] || ''
    ]);

    const title = `${translations[language].rangeReport} - ${formatDate(startDate)} to ${formatDate(endDate)}`;
    await exportToPDF(exportData, title, headers, language);
    setShowExportDropdown(false);
  };

  const handlePrintReport = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const html = generateHTMLReport(
      data.map(item => [
        item[0]?.split("-").reverse().join("/") || '',
        formatTime(item[1]) || '',
        formatTime(item[2]) || '',
        item[3] || '',
        item[4] || ''
      ]),
      `${translations[language].rangeReport} - ${formatDate(startDate)} to ${formatDate(endDate)}`,
      headers
    );

    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert(translations[language].error, 'Cannot print report');
    }
    setShowExportDropdown(false);
  };

  // Load language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  return (
    <View style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Date Range Check</Text>
            <Text style={styles.headerSubtitle}>Check data for multiple dates</Text>
          </View>
          <View style={styles.headerActions}>
            {data.length > 0 && (
              <View style={styles.exportContainer}>
                <TouchableOpacity 
                  style={[styles.exportButton, { backgroundColor: '#00D26B' }]}
                  onPress={toggleExportDropdown}
                >
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.exportButtonText}>Export</Text>
                  <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                
                {/* Export Dropdown */}
                {showExportDropdown && (
                  <>
                    <TouchableOpacity 
                      style={styles.dropdownOverlay}
                      activeOpacity={1}
                      onPress={toggleExportDropdown}
                    />
                    <Animated.View 
                      style={[
                        styles.exportDropdown,
                        {
                          opacity: exportAnimation,
                          transform: [{
                            scale: exportAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.95, 1]
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={styles.exportDropdownTitle}>{translations[language].exportOptions}</Text>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#E8F5E8' }]}
                        onPress={handleExportExcel}
                      >
                        <Ionicons name="document-text-outline" size={20} color="#00D26B" />
                        <Text style={[styles.exportDropdownText, { color: '#00D26B' }]}>
                          {translations[language].exportExcel}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#FFEBEE' }]}
                        onPress={handleExportPDF}
                      >
                        <Ionicons name="document-outline" size={20} color="#FF6B6B" />
                        <Text style={[styles.exportDropdownText, { color: '#FF6B6B' }]}>
                          {translations[language].exportPDF}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#FFF3E0' }]}
                        onPress={handlePrintReport}
                      >
                        <Ionicons name="print-outline" size={20} color="#FF9800" />
                        <Text style={[styles.exportDropdownText, { color: '#FF9800' }]}>
                          {translations[language].printReport}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </>
                )}
                
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchRangeData}
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D26B']}
            tintColor="#00D26B"
            title={translations[language].pullToRefresh}
            titleColor="#666"
          />
        }
      >
        <View style={styles.card}>
          {/* --- Date Range Pickers --- */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Start Date</Text>
            {Platform.OS === "web" ? (
              <TextInput 
                style={styles.dateInput} 
                type="date" 
                value={startDate.toISOString().split("T")[0]} 
                onChange={(e) => setStartDate(new Date(e.target.value))} 
              />
            ) : (
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="play-outline" size={20} color="#00D26B" />
                <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                <Ionicons name="chevron-down-outline" size={20} color="#666" />
              </TouchableOpacity>
            )}
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear(), 6, 14)}
                onChange={(e, selected) => {
                  setShowStartPicker(false);
                  if (selected) setStartDate(selected);
                }}
              />
            )}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>End Date</Text>
            {Platform.OS === "web" ? (
              <TextInput 
                style={styles.dateInput} 
                type="date" 
                value={endDate.toISOString().split("T")[0]} 
                onChange={(e) => setEndDate(new Date(e.target.value))} 
              />
            ) : (
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="stop-outline" size={20} color="#FF6B6B" />
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                <Ionicons name="chevron-down-outline" size={20} color="#666" />
              </TouchableOpacity>
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(e, selected) => {
                  setShowEndPicker(false);
                  if (selected) setEndDate(selected);
                }}
              />
            )}
          </View>

          {/* --- Action Button --- */}
          <TouchableOpacity style={styles.fetchButton} onPress={fetchRangeData}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.fetchButtonText}>Fetch Range Data</Text>
          </TouchableOpacity>

          {/* --- Loading State --- */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00D26B" />
              <Text style={styles.loadingText}>Loading range data...</Text>
            </View>
          )}

          {/* --- Error State --- */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* --- Data Table --- */}
          {data.length > 0 && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableTitle}>Range Results ({data.length} records)</Text>
              </View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>Date</Text>
                  <Text style={styles.headerCell}>ON</Text>
                  <Text style={styles.headerCell}>OFF</Text>
                  <Text style={styles.headerCell}>D-Frost</Text>
                  <Text style={styles.headerCell}>Freeze Time</Text>
                </View>
                {data.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCell}>
                      {item[0]?.split("-").reverse().join("/")}
                    </Text>
                    <Text style={styles.tableCell}>
                      {formatTime(item[1])}
                    </Text>
                    <Text style={styles.tableCell}>
                      {formatTime(item[2])}
                    </Text>
                    <Text style={styles.tableCell}>{item[3]}</Text>
                    <Text style={styles.tableCell}>{item[4]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
}

//--- MonthlyScreen ---
function MonthlyScreen({ sheetId }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportAnimation = useState(new Animated.Value(0))[0];

  const getMonthRange = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return { first, last };
  };

  const formatTime = (datetime) => {
    if (!datetime) return "";
    const match = datetime.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : datetime;
  };

  const fetchMonthData = async () => {
    setLoading(true);
    setError("");
    setData([]);
    const { first, last } = getMonthRange(selectedMonth);
    let allData = [];
    let current = new Date(first);

    while (current <= last && current <= new Date()) {
      const sheetName = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
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
        // Skip missing dates
      }
      current.setDate(current.getDate() + 1);
    }

    if (allData.length === 0) {
      setError("❌ No data found for this month");
    }
    setData(allData);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthData();
    setRefreshing(false);
  };

  const toggleExportDropdown = () => {
    if (showExportDropdown) {
      Animated.timing(exportAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => setShowExportDropdown(false));
    } else {
      setShowExportDropdown(true);
      Animated.spring(exportAnimation, {
        toValue: 1,
        damping: 12,
        mass: 0.8,
        stiffness: 100,
        useNativeDriver: true
      }).start();
    }
  };

  const sumDFrost = () => {
    let sum = 0;
    data.forEach(row => {
      const val = parseFloat(row[3]);
      if (!isNaN(val)) sum += val;
    });
    return sum.toFixed(2);
  };

  const getMonthName = (date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleExportExcel = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const exportData = data.map(item => [
      item[0]?.split("-").reverse().join("/") || '',
      formatTime(item[1]) || '',
      formatTime(item[2]) || '',
      item[3] || '',
      item[4] || ''
    ]);

    const filename = `monthly_report_${getMonthName(selectedMonth).replace(' ', '_')}.csv`;
    await exportToExcel(exportData, filename, headers, language);
    setShowExportDropdown(false);
  };

  const handleExportPDF = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const exportData = data.map(item => [
      item[0]?.split("-").reverse().join("/") || '',
      formatTime(item[1]) || '',
      formatTime(item[2]) || '',
      item[3] || '',
      item[4] || ''
    ]);

    const title = `${translations[language].monthlyReport} - ${getMonthName(selectedMonth)}`;
    await exportToPDF(exportData, title, headers, language);
    setShowExportDropdown(false);
  };

  const handlePrintReport = async () => {
    if (data.length === 0) {
      Alert.alert(translations[language].error, translations[language].noData);
      return;
    }

    const headers = ['Date', 'Start Time', 'End Time', 'Freeze', 'Time'];
    const html = generateHTMLReport(
      data.map(item => [
        item[0]?.split("-").reverse().join("/") || '',
        formatTime(item[1]) || '',
        formatTime(item[2]) || '',
        item[3] || '',
        item[4] || ''
      ]),
      `${translations[language].monthlyReport} - ${getMonthName(selectedMonth)}`,
      headers
    );

    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert(translations[language].error, 'Cannot print report');
    }
    setShowExportDropdown(false);
  };

  // Load language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  return (
    <View style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Monthly Report</Text>
            <Text style={styles.headerSubtitle}>Monthly data summary and analytics</Text>
          </View>
          <View style={styles.headerActions}>
            {data.length > 0 && (
              <View style={styles.exportContainer}>
                <TouchableOpacity 
                  style={[styles.exportButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={toggleExportDropdown}
                >
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.exportButtonText}>Export</Text>
                  <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                
                {/* Export Dropdown */}
                {showExportDropdown && (
                  <>
                    <TouchableOpacity 
                      style={styles.dropdownOverlay}
                      activeOpacity={1}
                      onPress={toggleExportDropdown}
                    />
                    <Animated.View 
                      style={[
                        styles.exportDropdown,
                        {
                          opacity: exportAnimation,
                          transform: [{
                            scale: exportAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.95, 1]
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={styles.exportDropdownTitle}>{translations[language].exportOptions}</Text>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#E8F5E8' }]}
                        onPress={handleExportExcel}
                      >
                        <Ionicons name="document-text-outline" size={20} color="#00D26B" />
                        <Text style={[styles.exportDropdownText, { color: '#00D26B' }]}>
                          {translations[language].exportExcel}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#FFEBEE' }]}
                        onPress={handleExportPDF}
                      >
                        <Ionicons name="document-outline" size={20} color="#FF6B6B" />
                        <Text style={[styles.exportDropdownText, { color: '#FF6B6B' }]}>
                          {translations[language].exportPDF}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.exportDropdownItem, { backgroundColor: '#FFF3E0' }]}
                        onPress={handlePrintReport}
                      >
                        <Ionicons name="print-outline" size={20} color="#FF9800" />
                        <Text style={[styles.exportDropdownText, { color: '#FF9800' }]}>
                          {translations[language].printReport}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </>
                )}
                
                <TouchableOpacity 
                  style={[styles.refreshButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={fetchMonthData}
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
            title={translations[language].pullToRefresh}
            titleColor="#666"
          />
        }
      >
        <View style={styles.card}>
          {/* --- Month Picker --- */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Select Month</Text>
            <TouchableOpacity 
              style={[styles.dateButton, { backgroundColor: '#FFF5F5' }]} 
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#FF6B6B" />
              <Text style={[styles.dateButtonText, { color: '#FF6B6B' }]}>
                {getMonthName(selectedMonth)}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={selectedMonth}
                mode="date"
                display="calendar"
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear(), 6, 31)}
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (date) setSelectedMonth(date);
                }}
              />
            )}
          </View>

          {/* --- Action Button --- */}
          <TouchableOpacity 
            style={[styles.fetchButton, { backgroundColor: '#FF6B6B' }]} 
            onPress={fetchMonthData}
          >
            <Ionicons name="bar-chart-outline" size={20} color="#fff" />
            <Text style={styles.fetchButtonText}>Generate Report</Text>
          </TouchableOpacity>

          {/* --- Loading State --- */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Generating report...</Text>
            </View>
          )}

          {/* --- Error State --- */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* --- Summary & Data --- */}
          {data.length > 0 && (
            <>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total D Frost</Text>
                <Text style={styles.summaryValue}>{sumDFrost()}</Text>
                <Text style={styles.summarySubtitle}>for {getMonthName(selectedMonth)}</Text>
              </View>

              {/* Data Table */}
              <View style={styles.tableContainer}>
                <Text style={styles.tableTitle}>Monthly Details ({data.length} records)</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>Date</Text>
                    <Text style={styles.headerCell}>Start</Text>
                    <Text style={styles.headerCell}>End</Text>
                    <Text style={styles.headerCell}>Freeze</Text>
                  </View>
                  {data.map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={styles.tableCell}>
                        {item[0]?.split("-").reverse().join("/")}
                      </Text>
                      <Text style={styles.tableCell}>
                        {formatTime(item[1])}
                      </Text>
                      <Text style={styles.tableCell}>
                        {formatTime(item[2])}
                      </Text>
                      <Text style={styles.tableCell}>{item[3]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
}

//--- ChartScreen ---
function ChartScreen({ sheetId }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [refreshing, setRefreshing] = useState(false);

  const getMonthRange = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return { first, last };
  };

  const getMonthName = (date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const fetchChartData = async () => {
    setLoading(true);
    setError("");
    setData([]);
    const { first, last } = getMonthRange(selectedMonth);
    let allData = [];
    let current = new Date(first);

    while (current <= last && current <= new Date()) {
      const sheetName = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (!(text.includes("DOCTYPE") || text.includes("error"))) {
          const parsed = Papa.parse(text, { header: false });
          parsed.data.slice(1).forEach(row => {
            allData.push({ 
              date: sheetName, 
              freeze: parseFloat(row[3]) || 0,
              runtime: parseFloat(row[4]?.replace('h', '')) || 0
            });
          });
        }
      } catch (err) {
        // Skip missing dates
      }
      current.setDate(current.getDate() + 1);
    }

    if (allData.length === 0) {
      setError("❌ No data found for this month");
    }
    setData(allData);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChartData();
    setRefreshing(false);
  };

  // Calculate chart data
  const getChartData = () => {
    if (data.length === 0) return { labels: [], freezeData: [], runtimeData: [] };

    const dailyData = {};
    data.forEach(item => {
      const date = item.date.split('-')[2]; // Get day
      if (!dailyData[date]) {
        dailyData[date] = { freeze: 0, runtime: 0, count: 0 };
      }
      dailyData[date].freeze += item.freeze;
      dailyData[date].runtime += item.runtime;
      dailyData[date].count += 1;
    });

    const labels = Object.keys(dailyData).sort();
    const freezeData = labels.map(date => dailyData[date].freeze);
    const runtimeData = labels.map(date => dailyData[date].runtime);

    return { labels, freezeData, runtimeData };
  };

  const chartData = getChartData();

  // Load language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  return (
    <View style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{translations[language].chartTitle}</Text>
            <Text style={styles.headerSubtitle}>Data visualization and analytics</Text>
          </View>
          {data.length > 0 && (
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: '#9C27B0' }]}
              onPress={fetchChartData}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9C27B0']}
            tintColor="#9C27B0"
            title={translations[language].pullToRefresh}
            titleColor="#666"
          />
        }
      >
        <View style={styles.card}>
          {/* --- Month Picker --- */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Select Month</Text>
            <TouchableOpacity 
              style={[styles.dateButton, { backgroundColor: '#F3E5F5' }]} 
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#9C27B0" />
              <Text style={[styles.dateButtonText, { color: '#9C27B0' }]}>
                {getMonthName(selectedMonth)}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#9C27B0" />
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={selectedMonth}
                mode="date"
                display="calendar"
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear(), 6, 31)}
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (date) setSelectedMonth(date);
                }}
              />
            )}
          </View>

          {/* --- Action Button --- */}
          <TouchableOpacity 
            style={[styles.fetchButton, { backgroundColor: '#9C27B0' }]} 
            onPress={fetchChartData}
          >
            <Ionicons name="bar-chart-outline" size={20} color="#fff" />
            <Text style={styles.fetchButtonText}>Load Chart Data</Text>
          </TouchableOpacity>

          {/* --- Loading State --- */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9C27B0" />
              <Text style={styles.loadingText}>Loading chart data...</Text>
            </View>
          )}

          {/* --- Error State --- */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* --- Chart Display --- */}
          {data.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>
                {translations[language].chartTitle} - {getMonthName(selectedMonth)}
              </Text>
              
              {/* Summary Cards */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
                  <Text style={[styles.statLabel, { color: '#00D26B' }]}>Total Days</Text>
                  <Text style={styles.statValue}>{chartData.labels.length}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
                  <Text style={[styles.statLabel, { color: '#FF6B6B' }]}>Total Freeze</Text>
                  <Text style={styles.statValue}>
                    {chartData.freezeData.reduce((a, b) => a + b, 0).toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Simple Bar Chart Representation */}
              <View style={styles.simpleChart}>
                <Text style={styles.chartSubtitle}>Daily Freeze Amount</Text>
                {chartData.labels.map((label, index) => (
                  <View key={label} style={styles.chartBarContainer}>
                    <Text style={styles.chartLabel}>Day {label}</Text>
                    <View style={styles.chartBarBackground}>
                      <View 
                        style={[
                          styles.chartBar, 
                          { 
                            width: `${Math.min((chartData.freezeData[index] / Math.max(...chartData.freezeData)) * 100, 100)}%`,
                            backgroundColor: '#00D26B'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.chartValue}>{chartData.freezeData[index]}</Text>
                  </View>
                ))}
              </View>

              {/* Data Table */}
              <View style={styles.tableContainer}>
                <Text style={styles.tableTitle}>Chart Data Details</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>Day</Text>
                    <Text style={styles.headerCell}>Freeze</Text>
                    <Text style={styles.headerCell}>Runtime</Text>
                  </View>
                  {chartData.labels.map((label, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{label}</Text>
                      <Text style={styles.tableCell}>{chartData.freezeData[index]}</Text>
                      <Text style={styles.tableCell}>{chartData.runtimeData[index]}h</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
}

//--- Main App ---
function App() {
  let [fontsLoaded] = useFonts({ 
    Kanit_400Regular, 
    Kanit_500Medium,
    Kanit_600SemiBold
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#00D26B" />
        <Text style={styles.loadingText}>Loading...</Text>
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
  const [sheetId, setSheetId] = useState(DEFAULT_SHEET_ID);
  const [updateReady, setUpdateReady] = useState(false);

  // ตรวจสอบและดาวน์โหลดอัพเดท
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    }
    checkForUpdates();
  }, []);

  // Load saved Sheet ID
  useEffect(() => {
    const loadSavedSheetId = async () => {
      try {
        const savedId = await AsyncStorage.getItem(SHEET_ID_KEY);
        if (savedId) {
          setSheetId(savedId);
        }
      } catch (error) {
        console.error('Error loading Sheet ID:', error);
      }
    };
    loadSavedSheetId();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 32,
          height: 60,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          position: 'absolute',
          bottom:  50,
          left: 20,
          right: 20,
          borderRadius: 15,
        },
        tabBarActiveTintColor: "#00D26B",
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: {
          fontFamily: "Kanit_500Medium",
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home"
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      >
        {() => <HomeScreen sheetId={sheetId} setSheetId={setSheetId} />}
      </Tab.Screen>
      <Tab.Screen
        name="CheckData"
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "document-text" : "document-text-outline"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      >
        {() => <CheckDataScreen sheetId={sheetId} />}
      </Tab.Screen>
      <Tab.Screen
        name="RangeData"
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "calendar" : "calendar-outline"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      >
        {() => <RangeDataScreen sheetId={sheetId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Monthly"
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "bar-chart" : "bar-chart-outline"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      >
        {() => <MonthlyScreen sheetId={sheetId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Chart"
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "pie-chart" : "pie-chart-outline"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      >
        {() => <ChartScreen sheetId={sheetId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

//--- Styles for Home Screen ---
const stylesHome = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  bottomPadding: {
    height: 50,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 9998,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 9999,
  },
  dateMenuDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 9999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
    marginHorizontal: 4,
    backgroundColor: '#F8F9FA',
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 15,
    fontFamily: 'Kanit_500Medium',
    color: '#333',
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 1000,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActionButtons: {
    flexDirection: 'row',
    gap: 10,
    position: 'relative',
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  appTitle: {
    fontSize: 24,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: "Kanit_400Regular",
    color: "#666",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
    marginTop: 15,
    marginBottom: 15,
  },
  statsGrid: {
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginRight: 5,
    marginLeft: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Kanit_400Regular",
    color: "#00D26B",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
  },
  tableContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableTitle: {
    fontSize: 18,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
    marginBottom: 15,
  },
  table: {
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Kanit_500Medium",
    color: "#666",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Kanit_400Regular",
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Kanit_400Regular",
    color: "#666",
    marginTop: 15,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Kanit_400Regular",
    color: "#FF6B6B",
    textAlign: "center",
  },
});

//--- Styles for Other Screens ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  bottomPadding: {
    height: 50,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: "Kanit_400Regular",
    color: "#666",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00D26B",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exportButton: {
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    gap: 6,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontFamily: "Kanit_500Medium",
    fontSize: 14,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  exportDropdown: {
    position: 'absolute',
    top: 40,
    right: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 19,
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 9999,
  },
  exportDropdownTitle: {
    fontSize: 14,
    fontFamily: 'Kanit_600SemiBold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  exportDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    gap: 10,
  },
  exportDropdownText: {
    fontSize: 14,
    fontFamily: 'Kanit_500Medium',
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    marginTop: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: "Kanit_500Medium",
    color: "#333",
    marginBottom: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 12,
    fontFamily: "Kanit_400Regular",
    fontSize: 16,
    color: "#333",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Kanit_500Medium",
    color: "#333",
    marginHorizontal: 12,
  },
  fetchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00D26B",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fetchButtonText: {
    color: "#FFFFFF",
    fontFamily: "Kanit_600SemiBold",
    fontSize: 16,
    marginLeft: 10,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Kanit_500Medium",
    color: "#666",
    marginTop: 15,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Kanit_400Regular",
    color: "#FF6B6B",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#FFE0E0",
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "Kanit_500Medium",
    color: "#FF6B6B",
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 36,
    fontFamily: "Kanit_600SemiBold",
    color: "#FF6B6B",
    marginBottom: 5,
  },
  summarySubtitle: {
    fontSize: 14,
    fontFamily: "Kanit_400Regular",
    color: "#999",
  },
  tableContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tableTitle: {
    fontSize: 18,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
  },
  table: {
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    paddingVertical: 15,
    paddingHorizontal: 12,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Kanit_500Medium",
    color: "#666",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Kanit_400Regular",
    color: "#333",
    textAlign: "center",
  },
  // Chart Screen Styles
  chartContainer: {
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
    marginBottom: 20,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 16,
    fontFamily: "Kanit_500Medium",
    color: "#666",
    marginBottom: 15,
    textAlign: 'center',
  },
  simpleChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    width: 60,
    fontSize: 12,
    fontFamily: "Kanit_400Regular",
    color: "#666",
  },
  chartBarBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 10,
  },
  chartValue: {
    width: 40,
    fontSize: 12,
    fontFamily: "Kanit_500Medium",
    color: "#333",
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Kanit_400Regular",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
  },
});

//--- Styles for Advertisement ---
const stylesAd = StyleSheet.create({
  languageButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#00D26B',
  },
  languageButtonText: {
    fontFamily: 'Kanit_500Medium',
    fontSize: 16,
    color: '#333',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  popup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 350,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontFamily: "Kanit_600SemiBold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Kanit_400Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: "#00D26B",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontFamily: "Kanit_600SemiBold",
    fontSize: 16,
  },
});
 
export default App;