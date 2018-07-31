// 消息类型
export const enum API_TYPE {
    EXEC_SERVER_STAT = 100,  // 通知 Agent 上报服务器状态
    REPORT_SERVER_STAT = 101,  // 收集 Agent 上报的服务器状态
    EXEC_CPU_PROFILER = 200,  // 通知 Agent 上报 CPU_PROFILER  数据
    REPORT_CPU_PROFILER = 201,  // 收集 Agent 上报的 CPU_PROFILER  数据
    EXEC_HEAP_SNAPSHOT = 300,  // 通过 Agent 上报 HEAP_SNAPSHOT 数据
    REPORT_HEAP_SNAPSHOT = 301,  // 收集 Agent 上报的 HEAP_SNAPSHOT 数据
}

// 错误码
export const enum API_ERR_CODE {
    MONITOR_ERROR_CODE_PACKET_READ = 3001,  // 读取协议包错误
    MONITOR_ERROR_CODE_PACKET_HEADER = 3002,  // 解析协议包头内容错误
    MONITOR_ERROR_CODE_PACKET_BODY = 3003,  // 解析协议包体内容错误
    MONITOR_ERROR_CODE_SYSTEM_TOKEN_NOT_MATCHED = 3004,  // 系统token不匹配
    MONITOR_ERROR_CODE_LOGIN_TOKEN_NOT_MATCHED = 3005,  // 登录token不匹配
    MONITOR_ERROR_CODE_ACCESS_DENIED = 3006,  // 操作权限无效
    MONITOR_ERROR_CODE_BODY_PROPERTY_WRONG = 3007,  // 包体属性错误
    MONITOR_ERROR_CODE_CLIENT_SLOW_CONNECTED = 3010,  // 客户端慢连接
}