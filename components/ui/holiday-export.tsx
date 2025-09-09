"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Holiday {
  id: number
  name: string
  date: string
  type: 'public' | 'company'
  project_id?: number | null
}

interface HolidayExportProps {
  holidays: Holiday[]
  year?: string
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function HolidayExport({ holidays, year }: HolidayExportProps) {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = async () => {
    try {
      setExporting(true)
      const currentYear = year || new Date().getFullYear().toString()
      
      const response = await fetch(`/api/holidays?format=csv&year=${currentYear}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `thai-holidays-${currentYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success(`CSV exported successfully for ${currentYear}`)
      } else {
        throw new Error('Failed to export CSV')
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const exportToPDF = async () => {
    try {
      setExporting(true)
      const currentYear = year || new Date().getFullYear().toString()
      
      // Create PDF document
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text(`Thai Public Holidays ${currentYear}`, 20, 30)
      
      // Add subtitle
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 20, 40)
      
      // Add summary
      const publicHolidays = holidays.filter(h => h.type === 'public')
      const companyHolidays = holidays.filter(h => h.type === 'company')
      
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(`Total Holidays: ${holidays.length}`, 20, 55)
      doc.text(`Public Holidays: ${publicHolidays.length}`, 20, 62)
      doc.text(`Company Holidays: ${companyHolidays.length}`, 20, 69)
      
      // Prepare table data
      const tableData = holidays.map(holiday => [
        holiday.name,
        new Date(holiday.date).toLocaleDateString('en-US', { 
          weekday: 'short',
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        holiday.type === 'public' ? 'Public' : 'Company',
        new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })
      ])
      
      // Add table
      doc.autoTable({
        head: [['Holiday Name', 'Date', 'Type', 'Day of Week']],
        body: tableData,
        startY: 80,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 70 }, // Holiday Name
          1: { cellWidth: 40 }, // Date
          2: { cellWidth: 25 }, // Type
          3: { cellWidth: 35 }  // Day of Week
        }
      })
      
      // Add footer
      const pageCount = doc.internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Budget Calculator - Thai Holiday Calendar | Page ${i} of ${pageCount}`,
          20,
          doc.internal.pageSize.height - 10
        )
      }
      
      // Save PDF
      doc.save(`thai-holidays-${currentYear}.pdf`)
      toast.success(`PDF exported successfully for ${currentYear}`)
      
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const currentYear = year || new Date().getFullYear().toString()
  const publicHolidays = holidays.filter(h => h.type === 'public')
  const companyHolidays = holidays.filter(h => h.type === 'company')

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Download className="h-4 w-4 mr-2" />
          Export Holiday Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {holidays.length} Total Holidays
          </Badge>
          <Badge variant="secondary">
            {publicHolidays.length} Public
          </Badge>
          <Badge variant="outline">
            {companyHolidays.length} Company
          </Badge>
          <Badge variant="outline">
            Year: {currentYear}
          </Badge>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={exporting}
            className="flex items-center"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* PDF Format Preview */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>PDF Format includes:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Professional header with title and generation date</li>
            <li>Summary statistics (total, public, company holidays)</li>
            <li>Detailed table with Holiday Name, Date, Type, and Day of Week</li>
            <li>Color-coded rows for easy reading</li>
            <li>Page numbers and footer branding</li>
            <li>Optimized for printing and sharing</li>
          </ul>
        </div>

        {/* CSV Format Preview */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>CSV Format includes:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Simple comma-separated format</li>
            <li>Headers: Holiday Name, Date, Type</li>
            <li>Compatible with Excel, Google Sheets</li>
            <li>Easy to import into other systems</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
