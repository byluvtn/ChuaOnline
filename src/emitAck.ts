import type { Socket } from 'socket.io-client';

/** Ack quá hạn sau 8 giây thì coi như thất bại (Fable #24). */
export const ACK_TIMEOUT_MS = 8000;

/**
 * Emit chờ ack có timeout + mở khóa ngay khi disconnect.
 * cb(r, timedOut): r là ack khi server trả lời kịp; timedOut=true khi quá
 * hạn hoặc mất kết nối (r undefined). Chỉ gọi cb đúng 1 lần.
 * Không fail-fast khi socket đang ngắt: emit được buffer, nếu nối lại trong
 * 8 giây thì ack vẫn về được; quá 8 giây thì timeout kích hoạt.
 */
export function emitAck<R>(
  socket: Socket,
  event: string,
  args: unknown[],
  cb: (r: R | undefined, timedOut: boolean) => void,
  timeoutMs = ACK_TIMEOUT_MS,
): void {
  let done = false;
  const finish = (r: R | undefined, timedOut: boolean) => {
    if (done) return;
    done = true;
    socket.off('disconnect', onDisconnect);
    cb(r, timedOut);
  };
  const onDisconnect = () => finish(undefined, true);
  socket.once('disconnect', onDisconnect);
  socket.timeout(timeoutMs).emit(event, ...args, (err: Error | null, r?: R) => {
    finish(err ? undefined : r, !!err);
  });
}
