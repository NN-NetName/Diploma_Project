import { useState, useEffect } from 'react'
import api from './api'
import ChatWindow from './components/ChatWindow'
import AuthPanel from './components/AuthPanel'
import UserProfile from './components/UserProfile'
import UserMentor from './components/UserMentor'
import MentorPanel from './components/MentorPanel'
import AdminPanel from './components/AdminPanel'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquareText, Users, LogIn, Info, UserRoundCheck, ShieldAlert } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("sibadi_tab") || "chat")
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("sibadi_auth") === "true")
  const [userRole, setUserRole] = useState(() => localStorage.getItem("sibadi_role") || null)
  const [userId, setUserId] = useState(() => localStorage.getItem("sibadi_uid") ? parseInt(localStorage.getItem("sibadi_uid")) : null)
  
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsersList, setAllUsersList] = useState([])
  const [stats, setStats] = useState({ total_users: 0, total_mentors: 0, grades: {}, tickets: {} })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("asc")

  const [isProfileEditing, setIsProfileEditing] = useState(true)
  const [profileData, setProfileData] = useState({ full_name: "", birth_date: "", education: "", department: "", position: "", experience_years: 0, vak_publications: 0, rinc_publications: 0 })
  const [calculatedGrade, setCalculatedGrade] = useState(null)

  const [mentorsList, setMentorsList] = useState([])       
  const [selectedMentorId, setSelectedMentorId] = useState("") 
  const [chosenMentorId, setChosenMentorId] = useState(null)   
  const [myTickets, setMyTickets] = useState([])           
  const [mentorTickets, setMentorTickets] = useState([])   
  const [ticketQuestion, setTicketQuestion] = useState("") 
  const [activeAnswerTexts, setActiveAnswerTexts] = useState({}) 

  useEffect(() => { localStorage.setItem("sibadi_tab", activeTab); }, [activeTab]);

  useEffect(() => {
    if (isLoggedIn && userId && userRole) {
      if (userRole === 'admin') loadAdminDashboard();
      else if (userRole === 'mentor') {
        loadMentorshipData('mentor', userId);
        api.get(`/auth/profile/${userId}`).then(res => {
          if (res.data?.profile?.full_name) {
            setProfileData(prev => ({ ...prev, full_name: res.data.profile.full_name }));
            setIsProfileEditing(false);
          }
        }).catch(err => console.error(err));
      } 
      else {
        api.get(`/auth/profile/${userId}`).then(res => {
          const pd = res.data.profile;
          setProfileData({
            full_name: pd.full_name || "", birth_date: pd.birth_date || "", education: pd.education || "", 
            department: pd.department || "", position: pd.position || "", experience_years: pd.experience_years || 0,
            vak_publications: pd.vak_publications || 0, rinc_publications: pd.rinc_publications || 0
          });
          setChosenMentorId(pd.mentor_id);
          if (res.data.grade_prediction) { setCalculatedGrade(res.data.grade_prediction); setIsProfileEditing(false); } 
          else { setIsProfileEditing(true); }
        }).catch(err => console.error(err));
        loadMentorshipData('user', userId);
      }
    }
  }, [isLoggedIn, userId, userRole]);

  const loadMentorshipData = async (role, uid) => {
    try {
      if (role === 'user') {
        const mentorsRes = await api.get('/tickets/mentors'); setMentorsList(mentorsRes.data);
        const ticketsRes = await api.get(`/tickets/my-tickets/${uid}`); setMyTickets(ticketsRes.data);
      } else if (role === 'mentor') {
        const mentorTicketsRes = await api.get(`/tickets/mentor-tickets/${uid}`); setMentorTickets(mentorTicketsRes.data);
      }
    } catch (error) { console.error("Ошибка", error) }
  }

  const loadAdminDashboard = async () => {
    try {
      const pendingRes = await api.get('/auth/users/pending'); setPendingUsers(pendingRes.data);
      const allUsersRes = await api.get('/auth/users/all'); setAllUsersList(allUsersRes.data);
      const statsRes = await api.get('/auth/analytics/stats'); setStats(statsRes.data);
    } catch (error) { toast.error("Ошибка загрузки панели") }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); if (!email || !password) { toast.error("Заполните все поля"); return }
    setIsAuthLoading(true);
    try {
      if (isLoginMode) {
        const response = await api.post('/auth/login', { email, password }); const { user_id, role } = response.data;
        setIsLoggedIn(true); setUserRole(role); setUserId(user_id);
        localStorage.setItem("sibadi_auth", "true"); localStorage.setItem("sibadi_role", role); localStorage.setItem("sibadi_uid", user_id);
        toast.success("Успешный вход!");
        if (role === 'admin') setActiveTab("admin"); else if (role === 'mentor') setActiveTab("mentor_panel"); else setActiveTab("profile");
      } else {
        await api.post('/auth/register', { email, password }); toast.success("Регистрация успешна!"); setIsLoginMode(true); setPassword("");
      }
    } catch (error) { toast.error(error.response?.data?.detail || "Ошибка сервера") } 
    finally { setIsAuthLoading(false) }
  }

  const handleLogout = () => {
    localStorage.removeItem("sibadi_auth"); localStorage.removeItem("sibadi_role"); localStorage.removeItem("sibadi_uid");
    setIsLoggedIn(false); setUserRole(null); setUserId(null); setEmail(""); setPassword("");
    setProfileData({ full_name: "", birth_date: "", education: "", department: "", position: "", experience_years: 0, vak_publications: 0, rinc_publications: 0 });
    setCalculatedGrade(null); setIsProfileEditing(true); setChosenMentorId(null); setMyTickets([]); setMentorTickets([]); setSelectedMentorId("");
    toast.info("Вы вышли из системы"); setActiveTab("chat");
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (['full_name', 'birth_date', 'education', 'department', 'position'].some(key => !profileData[key] || profileData[key].trim() === "")) { toast.error("Заполните обязательные поля!"); return }
    try {
      const response = await api.put(`/auth/profile/${userId}`, profileData); setCalculatedGrade(response.data.grade_prediction); setIsProfileEditing(false); toast.success("Грейд рассчитан.");
    } catch (error) { toast.error("Ошибка сохранения") }
  }

  const handleMentorNameSubmit = async (e) => {
    e.preventDefault(); if (!profileData.full_name || !profileData.full_name.trim()) { toast.error("Введите ФИО"); return }
    try { await api.put(`/auth/profile/${userId}`, profileData); setIsProfileEditing(false); toast.success("ФИО сохранено!") } 
    catch (error) { toast.error("Ошибка сохранения") }
  }

  const handleProfileChange = (e) => { setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  const handleDownloadDocx = async () => {
    try {
      toast.info("Формирование документа..."); const response = await api.get(`/auth/profile/${userId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Anketa_${profileData.full_name ? profileData.full_name.trim().replace(/\s+/g, '_') : 'User'}.docx`);
      document.body.appendChild(link); link.click(); link.parentNode.removeChild(link); toast.success("Успешно!");
    } catch (error) { toast.error("Ошибка генерации") }
  }

  const handleChooseMentor = async () => {
    if (!selectedMentorId) { toast.error("Выберите наставника"); return }
    try { await api.post(`/tickets/choose-mentor/${userId}`, { mentor_id: parseInt(selectedMentorId) }); setChosenMentorId(parseInt(selectedMentorId)); toast.success("Наставник закреплен!"); loadMentorshipData('user', userId); } 
    catch (error) { toast.error("Ошибка") }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault(); if (!ticketQuestion.trim()) { toast.error("Введите вопрос"); return }
    try { await api.post(`/tickets/create/${userId}`, { question: ticketQuestion }); setTicketQuestion(""); toast.success("Вопрос отправлен!"); loadMentorshipData('user', userId); } 
    catch (error) { toast.error("Ошибка отправки") }
  }

  const handleSendAnswer = async (ticketId) => {
    const txt = activeAnswerTexts[ticketId]; if (!txt || !txt.trim()) { toast.error("Заполните ответ"); return }
    try { await api.put(`/tickets/${ticketId}/answer`, { answer: txt }); toast.success("Ответ отправлен!"); setActiveAnswerTexts(prev => ({ ...prev, [ticketId]: "" })); loadMentorshipData('mentor', userId); } 
    catch (error) { toast.error("Ошибка") }
  }

  const handleUserStatus = async (uid, newStatus) => {
    try { await api.put(`/auth/users/${uid}/status`, { status: newStatus }); toast.success("Статус обновлен"); loadAdminDashboard(); } 
    catch (error) { toast.error("Ошибка") }
  }

  const handleToggleRole = async (targetUid, currentRole) => {
    const newRole = currentRole === 'user' ? 'mentor' : 'user';
    try { await api.put(`/auth/users/${targetUid}/role`, { role: newRole }); toast.success("Роль изменена"); loadAdminDashboard(); } 
    catch (error) { toast.error("Ошибка") }
  }

  const filteredUsers = allUsersList.filter(u => u.role !== 'admin').filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase())).filter(u => statusFilter === 'all' || u.status === statusFilter).filter(u => roleFilter === 'all' || u.role === roleFilter).sort((a, b) => sortOrder === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email))
  const hasPendingTicketsForMentor = mentorTickets.some(t => t.status === 'pending');
  const hasPendingRegistrations = pendingUsers.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Toaster position="top-center" richColors />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col min-h-[100dvh]">
        <header className="bg-[#315b8c] text-white shadow-md sticky top-0 z-20 w-full">
          <div className="container mx-auto px-4 h-[72px] flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-default shrink-0">
              <img src="/logotipHeader.png" alt="СибАДИ" className="
              w-[70%]
              max-w-[140px]
              md:w-auto
              md:max-w-none
              md:h-20
              h-auto
              object-contain
              brightness-0 invert" />
              <div className="hidden md:block w-px h-8 bg-white/30"></div>
              <div className="hidden md:block text-sm font-medium leading-snug text-white/90">Интеллектуальный<br/>ассистент НПР</div>
            </div>

            <TabsList className="flex h-full bg-transparent p-0 space-x-1 border-none text-white w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] justify-start md:justify-end ml-4">
              <TabsTrigger value="chat" className="shrink-0 h-full rounded-none bg-transparent text-white/80 hover:text-white data-[state=active]:bg-[#264871] data-[state=active]:text-white hover:bg-white/10 text-[14px] md:text-[15px] font-medium border-b-[3px] border-transparent data-[state=active]:border-white px-4 transition-all">
                <MessageSquareText className="w-4 h-4 mr-2" /> ИИ-консультант
              </TabsTrigger>
              
              {userRole !== 'mentor' && userRole !== 'admin' && (
                <TabsTrigger value="mentor" onClick={() => isLoggedIn && loadMentorshipData('user', userId)} className="shrink-0 h-full rounded-none bg-transparent text-white/80 hover:text-white data-[state=active]:bg-[#264871] data-[state=active]:text-white hover:bg-white/10 text-[14px] md:text-[15px] font-medium border-b-[3px] border-transparent data-[state=active]:border-white px-4 transition-all">
                  <Users className="w-4 h-4 mr-2" /> Наставник
                </TabsTrigger>
              )}

              {isLoggedIn && userRole === 'mentor' && (
                <TabsTrigger value="mentor_panel" onClick={() => loadMentorshipData('mentor', userId)} className="shrink-0 h-full rounded-none bg-transparent text-white/80 hover:text-white data-[state=active]:bg-[#264871] data-[state=active]:text-white hover:bg-white/10 text-[14px] md:text-[15px] font-medium border-b-[3px] border-transparent data-[state=active]:border-white px-4 transition-all">
                  <div className="relative flex items-center">
                    <Users className="w-4 h-4 mr-2" /> Панель наставника
                    {hasPendingTicketsForMentor && ( <span className="absolute -top-1 -right-3 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-sm border border-white"></span></span> )}
                  </div>
                </TabsTrigger>
              )}
              
              {!isLoggedIn && (
                <TabsTrigger value="login" className="shrink-0 h-full rounded-none bg-transparent text-white/80 hover:text-white data-[state=active]:bg-[#264871] data-[state=active]:text-white hover:bg-white/10 text-[14px] md:text-[15px] font-medium border-b-[3px] border-transparent data-[state=active]:border-white px-4 transition-all">
                  <LogIn className="w-4 h-4 mr-2" /> Вход
                </TabsTrigger>
              )}
              {isLoggedIn && userRole === 'user' && (
                <TabsTrigger value="profile" className="shrink-0 h-full rounded-none bg-transparent text-white/80 hover:text-white data-[state=active]:bg-[#264871] data-[state=active]:text-white hover:bg-white/10 text-[14px] md:text-[15px] font-medium border-b-[3px] border-transparent data-[state=active]:border-white px-4 transition-all">
                  <UserRoundCheck className="w-4 h-4 mr-2" /> Личный кабинет
                </TabsTrigger>
              )}

              {isLoggedIn && userRole === 'admin' && (
                <TabsTrigger value="admin" onClick={loadAdminDashboard} className="shrink-0 h-full rounded-none bg-transparent text-white/80 hover:text-white data-[state=active]:bg-[#264871] data-[state=active]:text-white hover:bg-white/10 text-[14px] md:text-[15px] font-medium border-b-[3px] border-transparent data-[state=active]:border-white px-4 transition-all">
                  <div className="relative flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2" /> Панель модерации
                    {hasPendingRegistrations && ( <span className="absolute -top-1 -right-3 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-sm border border-white"></span></span> )}
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </header>

        <main className={`flex-1 container mx-auto px-4 max-w-5xl flex flex-col ${activeTab === 'chat' ? 'py-0' : 'py-8'}`}>
          <TabsContent value="chat"><ChatWindow isLoggedIn={isLoggedIn} userId={userId} onRequireAuth={() => { setActiveTab("login"); toast.error("Необходимо авторизоваться") }} /></TabsContent>
          <TabsContent value="mentor"><UserMentor isLoggedIn={isLoggedIn} chosenMentorId={chosenMentorId} mentorsList={mentorsList} selectedMentorId={selectedMentorId} setSelectedMentorId={setSelectedMentorId} handleChooseMentor={handleChooseMentor} ticketQuestion={ticketQuestion} setTicketQuestion={setTicketQuestion} handleCreateTicket={handleCreateTicket} myTickets={myTickets} profileData={profileData} /></TabsContent>
          {isLoggedIn && userRole === 'mentor' && (<TabsContent value="mentor_panel"><MentorPanel profileData={profileData} isProfileEditing={isProfileEditing} handleProfileChange={handleProfileChange} handleMentorNameSubmit={handleMentorNameSubmit} mentorTickets={mentorTickets} activeAnswerTexts={activeAnswerTexts} setActiveAnswerTexts={setActiveAnswerTexts} handleSendAnswer={handleSendAnswer} handleLogout={handleLogout} /></TabsContent>)}
          <TabsContent value="login"><AuthPanel isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} isAuthLoading={isAuthLoading} handleAuthSubmit={handleAuthSubmit} /></TabsContent>
          {isLoggedIn && userRole === 'user' && (<TabsContent value="profile"><UserProfile profileData={profileData} isProfileEditing={isProfileEditing} setIsProfileEditing={setIsProfileEditing} handleProfileChange={handleProfileChange} handleProfileSubmit={handleProfileSubmit} calculatedGrade={calculatedGrade} handleDownloadDocx={handleDownloadDocx} handleLogout={handleLogout} /></TabsContent>)}
          {isLoggedIn && userRole === 'admin' && (<TabsContent value="admin"><AdminPanel pendingUsers={pendingUsers} stats={stats} searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} roleFilter={roleFilter} setRoleFilter={setRoleFilter} sortOrder={sortOrder} setSortOrder={setSortOrder} filteredUsers={filteredUsers} handleLogout={handleLogout} handleUserStatus={handleUserStatus} handleToggleRole={handleToggleRole} /></TabsContent>)}
        </main>

        {activeTab !== "chat" && (
          <footer className="bg-[#2c527e] text-white/90 py-10 mt-auto border-t-[5px] border-[#1d395a]">
            <div className="container mx-auto px-4 max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-10">
              <div><img src="/logotipFooter.png" alt="СибАДИ" className="
              w-[70%]
              max-w-[180px]
              md:w-auto
              md:max-w-none
              md:h-28
              h-auto
              mb-4
              object-contain 
              brightness-0 invert" /></div>
              <div><div className="font-bold text-lg mb-4 text-white">Контакты</div><ul className="text-sm space-y-3 text-white/80"><li>Россия, 644080 г. Омск, пр. Мира 5</li><li>Телефон: (3812) 65-23-11</li><li>Эл.почта: cit@cdo.sibadi.org</li></ul></div>
              <div><div className="font-bold text-lg mb-4 text-white flex items-center gap-2"><Info className="w-5 h-5" /> Справка по системе</div><ul className="text-sm space-y-2 leading-relaxed text-white/80"><li><strong>ИИ-консультант:</strong> Отвечает по регламенту.</li><li><strong>Личный кабинет:</strong> Расчет грейдов и скачивание документов.</li><li><strong>Наставник:</strong> Подача официальных тикетов кураторам.</li></ul></div>
            </div>
          </footer>
        )}
      </Tabs>
    </div>
  )
}

export default App