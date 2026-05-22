import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Users, ShieldCheck, BarChart3, Award, Search, Check, X } from "lucide-react"

export default function AdminPanel({ pendingUsers, stats, searchTerm, setSearchTerm, statusFilter, setStatusFilter, roleFilter, setRoleFilter, sortOrder, setSortOrder, filteredUsers, handleLogout, handleUserStatus, handleToggleRole }) {
  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
          <div><CardTitle className="text-xl font-bold text-red-600">Новые заявки на модерацию ({pendingUsers.length})</CardTitle><CardDescription>Пользователи, ожидающие одобрения доступа в систему.</CardDescription></div>
          <Button variant="outline" onClick={handleLogout} className="border-slate-300">Выйти</Button>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? ( <p className="text-center py-4 text-slate-400 text-sm">Нет новых заявок на модерацию.</p> ) : (
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                  <span className="font-medium text-sm">{user.email}</span>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUserStatus(user.id, 'approved')} className="bg-green-600 hover:bg-green-700 h-8 text-xs text-white"><Check className="w-3 h-3 mr-1" /> Одобрить</Button>
                    <Button variant="destructive" onClick={() => handleUserStatus(user.id, 'rejected')} className="h-8 text-xs"><X className="w-3 h-3 mr-1" /> Отклонить</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card className="bg-blue-50/50 border-blue-200 shadow-sm flex flex-col items-center justify-center p-6 gap-3 text-center">
    <div className="p-3 bg-blue-600 rounded-xl text-white"><Users className="w-6 h-6" /></div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase mb-1">Всего соискателей</p>
      <h3 className="text-2xl font-bold text-slate-800">{stats.total_users} чел.</h3>
    </div>
  </Card>

  <Card className="bg-purple-50/50 border-purple-200 shadow-sm flex flex-col items-center justify-center p-6 gap-3 text-center">
    <div className="p-3 bg-purple-600 rounded-xl text-white"><ShieldCheck className="w-6 h-6" /></div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase mb-1">Активных наставников</p>
      <h3 className="text-2xl font-bold text-slate-800">{stats.total_mentors} чел.</h3>
    </div>
  </Card>

  <Card className="bg-orange-50/50 border-orange-200 shadow-sm flex flex-col items-center justify-center p-6 gap-3 text-center">
    <div className="p-3 bg-orange-500 rounded-xl text-white"><BarChart3 className="w-6 h-6" /></div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase mb-1">Всего запросов</p>
      <h3 className="text-2xl font-bold text-slate-800">{stats.tickets?.total || 0} шт.</h3>
    </div>
  </Card>
</div>
      <Card className="border border-slate-200 shadow-sm bg-white"><CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-[#315b8c]" /> Распределение сотрудников по уровням грейдов</CardTitle></CardHeader><CardContent className="space-y-3">{['Грейд 3', 'Грейд 2', 'Грейд 1', 'Не назначен'].map(g => { const count = stats.grades?.[g] || 0; const percent = stats.total_users > 0 ? (count / stats.total_users) * 100 : 0; return ( <div key={g} className="space-y-1"><div className="flex justify-between text-sm font-medium text-slate-700"><span>{g}</span><span className="font-bold">{count} чел. ({Math.round(percent)}%)</span></div><div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-[#315b8c] h-full transition-all" style={{ width: `${percent || 5}%` }}></div></div></div> ) })}</CardContent></Card>
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader><CardTitle className="text-xl font-bold text-[#315b8c]">Реестр сотрудников и управление ролями</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex items-center"><Search className="w-4 h-4 absolute left-3 text-slate-400" /><Input placeholder="Поиск по Email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-xs bg-white focus-visible:ring-[#315b8c]"/></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 text-xs border rounded-md bg-white text-slate-700"><option value="all">Все статусы</option><option value="approved">Одобрен</option><option value="pending">В ожидании</option><option value="rejected">Отклонен</option></select>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 px-3 text-xs border rounded-md bg-white text-slate-700"><option value="all">Все роли</option><option value="user">Соискатель (НПР)</option><option value="mentor">Наставник</option></select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="h-9 px-3 text-xs border rounded-md bg-white text-slate-700"><option value="asc">А → Я</option><option value="desc">Я → А</option></select>
          </div>
          <div className="border rounded-lg overflow-x-auto bg-white">
            <table className="w-full border-collapse text-left text-sm"><thead className="bg-slate-50 font-semibold border-b text-slate-700"><tr><th className="p-3">Пользователь</th><th className="p-3">Статус входа</th><th className="p-3">Текущая роль</th><th className="p-3 text-right">Действие</th></tr></thead><tbody className="divide-y text-slate-600">{filteredUsers.length === 0 ? ( <tr><td colSpan="4" className="text-center py-8 text-slate-400 text-xs">Не найдено.</td></tr> ) : ( filteredUsers.map(u => ( <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 font-medium text-slate-800">
                  {u.profile && u.profile.full_name ? (
                    <div>
                      <div>{u.profile.full_name}</div>
                      <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                    </div>
                  ) : (
                    u.email
                  )}
                </td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.status === 'approved' ? 'bg-green-100 text-green-800' : u.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{u.status}</span></td><td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'mentor' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role === 'mentor' ? 'Наставник' : 'Соискатель (НПР)'}</span></td><td className="p-3 text-right"><Button variant="outline" size="sm" onClick={() => handleToggleRole(u.id, u.role)} className="h-8 text-xs border-slate-300 hover:bg-slate-100">{u.role === 'user' ? 'Сделать наставником' : 'Сделать соискателем'}</Button></td></tr> )) )}</tbody></table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}