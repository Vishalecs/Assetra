export const apiSuccess = (res: any, data: any, status = 200) => {
  return res.status(status).json({ success: true, data });
};

export const apiError = (res: any, message: string, status = 400, details?: any) => {
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};
