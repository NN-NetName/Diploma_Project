import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function UserProfile({ profileData, isProfileEditing, setIsProfileEditing, handleProfileChange, handleProfileSubmit, calculatedGrade, handleDownloadDocx, handleLogout }) {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 mb-6">
        <div>
          <CardTitle className="text-2xl font-bold text-[#315b8c]">Личный кабинет</CardTitle>
          <CardDescription>Заполните данные анкеты для автоматического расчета грейда.</CardDescription>
        </div>
        <Button variant="outline" onClick={handleLogout} className="border-slate-300">Выйти</Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">ФИО *</label><Input name="full_name" disabled={!isProfileEditing} value={profileData.full_name} onChange={handleProfileChange} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Дата рождения *</label><Input name="birth_date" type="date" disabled={!isProfileEditing} value={profileData.birth_date} onChange={handleProfileChange} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Образование *</label><Input name="education" disabled={!isProfileEditing} value={profileData.education} onChange={handleProfileChange} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Кафедра *</label><Input name="department" disabled={!isProfileEditing} value={profileData.department} onChange={handleProfileChange} /></div>
            <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium">Должность *</label><Input name="position" disabled={!isProfileEditing} value={profileData.position} onChange={handleProfileChange} /></div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-semibold text-[#315b8c]">Данные для расчета грейда</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">Стаж (лет) *</label><Input name="experience_years" type="number" min="0" disabled={!isProfileEditing} value={profileData.experience_years} onChange={handleProfileChange} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Публикации ВАК *</label><Input name="vak_publications" type="number" min="0" disabled={!isProfileEditing} value={profileData.vak_publications} onChange={handleProfileChange} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Публикации РИНЦ *</label><Input name="rinc_publications" type="number" min="0" disabled={!isProfileEditing} value={profileData.rinc_publications} onChange={handleProfileChange} /></div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {!isProfileEditing ? (
              <>
                <Button type="button" onClick={(e) => { e.preventDefault(); setIsProfileEditing(true); }} className="w-full md:w-auto bg-slate-600 hover:bg-slate-700 text-white">Редактировать профиль</Button>
                <Button type="button" onClick={handleDownloadDocx} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md"><Download className="w-4 h-4 mr-2" /> Скачать анкету</Button>
              </>
            ) : (
              <Button type="submit" className="w-full md:w-auto bg-[#315b8c] hover:bg-[#264871] text-white">Сохранить и рассчитать грейд</Button>
            )}
          </div>
        </form>
        {calculatedGrade && !isProfileEditing && (
          <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-1">Решение системы</p>
            <h2 className="text-2xl font-bold text-green-900">{calculatedGrade}</h2>
          </div>
        )}
      </CardContent>
    </Card>
  )
}