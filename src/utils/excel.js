import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Excel export utilities
export const excelUtils = {
  // Export data to Excel file
  exportToExcel: (data, filename = 'export', sheetName = 'Sheet1') => {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new()
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(data)
      
      // Auto-size columns
      const columnWidths = excelUtils.calculateColumnWidths(data)
      worksheet['!cols'] = columnWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      })
      
      // Save file
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const fullFilename = `${filename}_${timestamp}.xlsx`
      
      saveAs(blob, fullFilename)
      
      return {
        success: true,
        filename: fullFilename,
        recordCount: data.length
      }
    } catch (error) {
      console.error('Excel export error:', error)
      throw new Error('Excel导出失败: ' + error.message)
    }
  },
  
  // Export multiple sheets to Excel
  exportMultipleSheets: (sheetsData, filename = 'multi_export') => {
    try {
      const workbook = XLSX.utils.book_new()
      
      for (const sheetInfo of sheetsData) {
        const { data, sheetName, headers } = sheetInfo
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data)
        
        // Add custom headers if provided
        if (headers && headers.length > 0) {
          XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' })
        }
        
        // Auto-size columns
        const columnWidths = excelUtils.calculateColumnWidths(data)
        worksheet['!cols'] = columnWidths
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }
      
      // Generate and save Excel file
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      })
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const fullFilename = `${filename}_${timestamp}.xlsx`
      
      saveAs(blob, fullFilename)
      
      return {
        success: true,
        filename: fullFilename,
        sheetCount: sheetsData.length,
        totalRecords: sheetsData.reduce((sum, sheet) => sum + sheet.data.length, 0)
      }
    } catch (error) {
      console.error('Multi-sheet Excel export error:', error)
      throw new Error('Excel多表导出失败: ' + error.message)
    }
  },
  
  // Calculate optimal column widths
  calculateColumnWidths: (data) => {
    if (!data || data.length === 0) return []
    
    const columns = Object.keys(data[0])
    const widths = []
    
    for (const column of columns) {
      let maxWidth = column.length // Header width
      
      for (const row of data) {
        const value = String(row[column] || '')
        maxWidth = Math.max(maxWidth, value.length)
      }
      
      // Set reasonable limits
      widths.push({
        wch: Math.min(Math.max(maxWidth + 2, 10), 50)
      })
    }
    
    return widths
  },
  
  // Format data for Excel export
  formatDataForExport: (data, formatConfig = {}) => {
    if (!data || data.length === 0) return []
    
    return data.map(item => {
      const formatted = {}
      
      for (const [key, value] of Object.entries(item)) {
        const config = formatConfig[key]
        
        if (config && config.formatter) {
          formatted[config.header || key] = config.formatter(value, item)
        } else if (value instanceof Date) {
          formatted[config?.header || key] = value.toLocaleString('zh-CN')
        } else if (typeof value === 'boolean') {
          formatted[config?.header || key] = value ? '是' : '否'
        } else {
          formatted[config?.header || key] = value
        }
      }
      
      return formatted
    })
  }
}

// Pre-defined export configurations for different data types
export const exportConfigs = {
  // User data export configuration
  users: {
    filename: '用户数据',
    sheetName: '用户列表',
    formatConfig: {
      id: { header: 'ID' },
      realName: { header: '真实姓名' },
      phone: { header: '手机号' },
      alipayAccount: { header: '支付宝账户' },
      role: { 
        header: '用户角色',
        formatter: (value) => value === 'admin' ? '管理员' : '普通用户'
      },
      status: { 
        header: '状态',
        formatter: (value) => value === 'active' ? '启用' : '禁用'
      },
      createdAt: { 
        header: '创建时间',
        formatter: (value) => new Date(value).toLocaleString('zh-CN')
      },
      lastLoginAt: { 
        header: '最后登录',
        formatter: (value) => value ? new Date(value).toLocaleString('zh-CN') : '从未登录'
      }
    }
  },
  
  // Order data export configuration
  orders: {
    filename: '订单数据',
    sheetName: '订单列表',
    formatConfig: {
      id: { header: '订单ID' },
      userId: { header: '用户ID' },
      userName: { header: '用户姓名' },
      userPhone: { header: '用户手机' },
      userAlipayAccount: { header: '用户支付宝账户' },
      productName: { header: '商品名称' },
      quantity: { header: '数量' },
      price: { 
        header: '单价(元)',
        formatter: (value) => `¥${value.toFixed(2)}`
      },
      totalAmount: { 
        header: '总金额(元)',
        formatter: (value) => `¥${value.toFixed(2)}`
      },
      courierName: { header: '快递公司' },
      trackingNumber: { header: '快递单号' },
      status: { 
        header: '订单状态',
        formatter: (value) => {
          const statusMap = {
            'pending': '待处理',
            'completed': '已完成',
            'cancelled': '已取消'
          }
          return statusMap[value] || value
        }
      },
      createdAt: { 
        header: '创建时间',
        formatter: (value) => new Date(value).toLocaleString('zh-CN')
      },
      updatedAt: { 
        header: '更新时间',
        formatter: (value) => new Date(value).toLocaleString('zh-CN')
      }
    }
  },
  
  // Product data export configuration
  products: {
    filename: '商品数据',
    sheetName: '商品列表',
    formatConfig: {
      id: { header: '商品ID' },
      name: { header: '商品名称' },
      price: { 
        header: '价格(元)',
        formatter: (value) => `¥${value.toFixed(2)}`
      },
      status: { 
        header: '状态',
        formatter: (value) => value === 'active' ? '启用' : '禁用'
      },
      createdAt: { 
        header: '创建时间',
        formatter: (value) => new Date(value).toLocaleString('zh-CN')
      }
    }
  },
  
  // Courier data export configuration
  couriers: {
    filename: '快递公司数据',
    sheetName: '快递公司列表',
    formatConfig: {
      id: { header: '快递公司ID' },
      name: { header: '快递公司名称' },
      trackingLength: { header: '快递单号长度' },
      status: { 
        header: '状态',
        formatter: (value) => value === 'active' ? '启用' : '禁用'
      },
      createdAt: { 
        header: '创建时间',
        formatter: (value) => new Date(value).toLocaleString('zh-CN')
      }
    }
  }
}

// Quick export functions for common data types
export const quickExport = {
  // Export users data
  users: (usersData) => {
    const config = exportConfigs.users
    const formattedData = excelUtils.formatDataForExport(usersData, config.formatConfig)
    return excelUtils.exportToExcel(formattedData, config.filename, config.sheetName)
  },
  
  // Export orders data
  orders: (ordersData) => {
    const config = exportConfigs.orders
    const formattedData = excelUtils.formatDataForExport(ordersData, config.formatConfig)
    return excelUtils.exportToExcel(formattedData, config.filename, config.sheetName)
  },
  
  // Export products data
  products: (productsData) => {
    const config = exportConfigs.products
    const formattedData = excelUtils.formatDataForExport(productsData, config.formatConfig)
    return excelUtils.exportToExcel(formattedData, config.filename, config.sheetName)
  },
  
  // Export couriers data
  couriers: (couriersData) => {
    const config = exportConfigs.couriers
    const formattedData = excelUtils.formatDataForExport(couriersData, config.formatConfig)
    return excelUtils.exportToExcel(formattedData, config.filename, config.sheetName)
  },
  
  // Export comprehensive report with all data
  comprehensive: (allData) => {
    const sheetsData = []

    if (allData.users && allData.users.length > 0) {
      const config = exportConfigs.users
      const formattedData = excelUtils.formatDataForExport(allData.users, config.formatConfig)
      sheetsData.push({
        data: formattedData,
        sheetName: config.sheetName
      })
    }

    if (allData.orders && allData.orders.length > 0) {
      const config = exportConfigs.orders
      const formattedData = excelUtils.formatDataForExport(allData.orders, config.formatConfig)
      sheetsData.push({
        data: formattedData,
        sheetName: config.sheetName
      })
    }

    if (allData.products && allData.products.length > 0) {
      const config = exportConfigs.products
      const formattedData = excelUtils.formatDataForExport(allData.products, config.formatConfig)
      sheetsData.push({
        data: formattedData,
        sheetName: config.sheetName
      })
    }

    if (allData.couriers && allData.couriers.length > 0) {
      const config = exportConfigs.couriers
      const formattedData = excelUtils.formatDataForExport(allData.couriers, config.formatConfig)
      sheetsData.push({
        data: formattedData,
        sheetName: config.sheetName
      })
    }

    return excelUtils.exportMultipleSheets(sheetsData, '系统数据综合报告')
  },

  // Export custom data with specified fields
  custom: (data, filename = '自定义数据') => {
    try {
      if (!data || data.length === 0) {
        throw new Error('没有数据可导出')
      }

      return excelUtils.exportToExcel(data, filename, '自定义导出')
    } catch (error) {
      console.error('Custom export error:', error)
      throw new Error('自定义导出失败: ' + error.message)
    }
  }
}

export default {
  utils: excelUtils,
  configs: exportConfigs,
  quick: quickExport
}