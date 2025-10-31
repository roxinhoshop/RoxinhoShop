param(
    [int]$Port = 5524
)

$ErrorActionPreference = 'Stop'

# HttpListener type is available in .NET; no need to load a non-existent assembly.

$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Static server running at $prefix"

function Get-ContentType($path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    switch ($ext) {
        '.html' { 'text/html; charset=utf-8' }
        '.css'  { 'text/css; charset=utf-8' }
        '.js'   { 'application/javascript; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.png'  { 'image/png' }
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.gif'  { 'image/gif' }
        '.svg'  { 'image/svg+xml' }
        '.ico'  { 'image/x-icon' }
        default { 'application/octet-stream' }
    }
}

function Send-Response($context, $statusCode, $bytes, $contentType) {
    $response = $context.Response
    $response.StatusCode = $statusCode
    if ($contentType) { $response.ContentType = $contentType }
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
}

while ($true) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $path = $request.Url.AbsolutePath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }

        $localPath = Join-Path (Get-Location) $path
        if (-not (Test-Path $localPath)) {
            # try default documents for directories
            if (Test-Path (Join-Path (Get-Location) $path) -PathType Container) {
                $localPath = Join-Path (Join-Path (Get-Location) $path) 'index.html'
            }
        }

        if (-not (Test-Path $localPath)) {
            $msg = "404 Not Found"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
            Send-Response -context $context -statusCode 404 -bytes $bytes -contentType 'text/plain; charset=utf-8'
            continue
        }

        $bytes = [System.IO.File]::ReadAllBytes($localPath)
        $ct = Get-ContentType -path $localPath
        Send-Response -context $context -statusCode 200 -bytes $bytes -contentType $ct
    }
    catch {
        try {
            $msg = "500 Internal Server Error: $($_.Exception.Message)"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
            Send-Response -context $context -statusCode 500 -bytes $bytes -contentType 'text/plain; charset=utf-8'
        }
        catch {}
    }
}
