"use client";

/** Cliente demo tras "Entrar como demo". La demo entra con correo ya verificado. */
export const DEMO_CLIENTE = {
  nombreCompleto: "Cliente Demo",
  correo: "cliente.demo@correo.com",
  correoEnmascarado: "c****@correo.com",
  celular: "+51 987 654 321",
  celularEnmascarado: "+51 9****4321",
  celularVerificado: false,
  tipoDocumento: "DNI" as const,
  documentoEnmascarado: "*****234",
};

export const PRODUCTOS_MOCK = [
  { sku: "A", nombre: "Producto A", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 59, stock: 10 },
  { sku: "B", nombre: "Producto B", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 72, stock: 8 },
  { sku: "C", nombre: "Producto C", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 89, stock: 5 },
  { sku: "D", nombre: "Producto D", categoria: "Calzado deportivo", talla: "Talla 42", color: "Negro", precio: 110, stock: 3 },
];

export const DISTRITOS = [
  "Lima Cercado", "Miraflores", "San Isidro", "Santiago de Surco",
  "La Molina", "San Miguel", "Los Olivos", "San Juan de Lurigancho",
  "Villa El Salvador", "Callao",
];
