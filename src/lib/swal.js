import Swal from 'sweetalert2'

/**
 * SweetAlert2 pre-configurado con tema oscuro GameTime
 */
const SwalGT = Swal.mixin({
  background: '#111111',
  color: '#f3f4f6',
  confirmButtonColor: '#F57C00',
  cancelButtonColor: '#374151',
  customClass: {
    popup:          'swal-gt-popup',
    title:          'swal-gt-title',
    htmlContainer:  'swal-gt-html',
    confirmButton:  'swal-gt-confirm',
    cancelButton:   'swal-gt-cancel',
    icon:           'swal-gt-icon',
  },
  buttonsStyling: true,
  showClass: {
    popup: 'animate__animated animate__fadeInDown animate__faster',
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp animate__faster',
  },
})

/** Toast pequeño para notificaciones de éxito/error */
export const Toast = SwalGT.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

/** Confirmación de acción destructiva (ej: eliminar) */
export const confirmDelete = (title = '¿Eliminar?', text = 'Esta acción no se puede deshacer.') =>
  SwalGT.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    reverseButtons: true,
  })

/** Confirmación de acción general */
export const confirmAction = (title, text, confirmText = 'Confirmar') =>
  SwalGT.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  })

/** Alerta de error */
export const alertError = (title, text) =>
  SwalGT.fire({ title, text, icon: 'error' })

/** Alerta de advertencia (sin bloquear, solo notifica) */
export const toastWarn = (title) =>
  Toast.fire({ title, icon: 'warning' })

/** Toast de éxito */
export const toastSuccess = (title) =>
  Toast.fire({ title, icon: 'success' })

/** Toast de error */
export const toastError = (title) =>
  Toast.fire({ title, icon: 'error' })

export default SwalGT
