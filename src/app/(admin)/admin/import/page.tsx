"use client";

import { AlertCircle, CheckCircle2, DollarSign, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportResult {
  success: boolean;
  summary?: {
    ordersCreated?: number;
    ordersSkipped?: number;
    itemsCreated?: number;
    productsCreated?: number;
    productsUpdated?: number;
    productsNotFound?: number;
    totalRowsProcessed?: number;
    totalRows?: number;
    errors?: string[];
    notFoundSkus?: string[];
  };
  error?: string;
  details?: string;
}

export default function ImportOrdersPage () {
  const [file, setFile] = useState<File | null>(null);
  const [costsFile, setCostsFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCosts, setIsUploadingCosts] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [costsResult, setCostsResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleCostsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setCostsFile(selectedFile);
      setCostsResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/orders", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Error de conexión",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadCosts = async () => {
    if (!costsFile) return;

    setIsUploadingCosts(true);
    setCostsResult(null);

    try {
      const formData = new FormData();
      formData.append("file", costsFile);

      const response = await fetch("/api/import/costs", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setCostsResult(data);
    } catch (error) {
      setCostsResult({
        success: false,
        error: "Error de conexión",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsUploadingCosts(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Importar Datos</h1>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Pedidos Históricos</TabsTrigger>
          <TabsTrigger value="costs">Costes de Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Formato del CSV (WooCommerce en español)
              </CardTitle>
              <CardDescription>
                Exporta desde WooCommerce con el plugin &quot;Advanced Order Export&quot; con estos campos:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-medium">Campos del pedido:</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li>Número de pedido</li>
                  <li>Estado del pedido</li>
                  <li>Fecha del pedido</li>
                  <li>Nombre (facturación)</li>
                  <li>Apellidos (facturación)</li>
                  <li>Correo electrónico (facturación)</li>
                  <li>Título del método de envío</li>
                  <li>Importe de envío del pedido</li>
                  <li>Importe total del pedido</li>
                </ul>
                <p className="font-medium mt-3">Campos del producto (con [P]):</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li>Artículo # (ID del producto)</li>
                  <li>ID de la variación</li>
                  <li>Nombre del artículo</li>
                  <li>SKU</li>
                  <li>Cantidad (- reembolso)</li>
                  <li>Coste de artículo (precio unitario)</li>
                  <li>Total del artículo (opcional, se calcula si no está)</li>
                </ul>
              </div>
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <p>• Marca la opción <strong>&quot;Output each order item in a separate row&quot;</strong></p>
                <p>• Los pedidos que ya existan serán ignorados automáticamente</p>
                <p>• También acepta nombres de columnas en inglés</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir archivo CSV de pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Archivo CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>

              {file && (
                <div className="text-sm text-muted-foreground">
                  Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar pedidos
                  </>
                )}
              </Button>

              {result && (
                <div
                  className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                >
                  {result.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        Importación completada
                      </div>
                      <div className="text-sm text-green-600 space-y-1">
                        <p>✓ {result.summary?.ordersCreated} pedidos creados</p>
                        <p>✓ {result.summary?.itemsCreated} líneas de producto importadas</p>
                        <p>✓ {result.summary?.productsCreated} productos nuevos creados</p>
                        <p>○ {result.summary?.ordersSkipped} pedidos ya existían (ignorados)</p>
                        <p className="text-muted-foreground">
                          Total de filas procesadas: {result.summary?.totalRowsProcessed}
                        </p>
                      </div>
                      {result.summary?.errors && result.summary.errors.length > 0 && (
                        <div className="mt-2 text-sm text-amber-600">
                          <p className="font-medium">Errores ({result.summary.errors.length}):</p>
                          <ul className="list-disc list-inside">
                            {result.summary.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-700 font-medium">
                        <AlertCircle className="h-5 w-5" />
                        Error en la importación
                      </div>
                      <p className="text-sm text-red-600">{result.error}</p>
                      {result.details && (
                        <p className="text-sm text-red-500">{result.details}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Formato del CSV de costes
              </CardTitle>
              <CardDescription>
                Sube un CSV con los costes de los productos por SKU
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                sku,coste<br />
                LBP-PICHI-MAESTRA-XL,12.02<br />
                LBP-BATA-MAESTRA-ML,33.76
              </div>
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <p>• Solo necesitas dos columnas: <strong>sku</strong> y <strong>coste</strong></p>
                <p>• Los costes pueden usar coma o punto como separador decimal</p>
                <p>• También se actualizarán los costes en pedidos existentes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Subir archivo CSV de costes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="costs-csv-file">Archivo CSV</Label>
                <Input
                  id="costs-csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCostsFileChange}
                  disabled={isUploadingCosts}
                />
              </div>

              {costsFile && (
                <div className="text-sm text-muted-foreground">
                  Archivo seleccionado: <strong>{costsFile.name}</strong> ({(costsFile.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <Button
                onClick={handleUploadCosts}
                disabled={!costsFile || isUploadingCosts}
                className="w-full"
              >
                {isUploadingCosts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando costes...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Importar costes
                  </>
                )}
              </Button>

              {costsResult && (
                <div
                  className={`p-4 rounded-lg ${costsResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                >
                  {costsResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        Importación completada
                      </div>
                      <div className="text-sm text-green-600 space-y-1">
                        <p>✓ {costsResult.summary?.productsUpdated} productos actualizados</p>
                        {costsResult.summary?.productsNotFound ? (
                          <p className="text-amber-600">⚠ {costsResult.summary.productsNotFound} SKUs no encontrados</p>
                        ) : null}
                        <p className="text-muted-foreground">
                          Total de filas: {costsResult.summary?.totalRows}
                        </p>
                      </div>
                      {costsResult.summary?.notFoundSkus && costsResult.summary.notFoundSkus.length > 0 && (
                        <div className="mt-2 text-sm text-amber-600">
                          <p className="font-medium">SKUs no encontrados:</p>
                          <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                            {costsResult.summary.notFoundSkus.map((sku, i) => (
                              <li key={i}>{sku}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-700 font-medium">
                        <AlertCircle className="h-5 w-5" />
                        Error en la importación
                      </div>
                      <p className="text-sm text-red-600">{costsResult.error}</p>
                      {costsResult.details && (
                        <p className="text-sm text-red-500">{costsResult.details}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
