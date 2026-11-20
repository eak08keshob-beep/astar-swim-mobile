# generate-ios-icons.ps1
Add-Type -AssemblyName System.Drawing

$masterIconPath = "E:\Master Mobile Apps\mobile-app-package\assets\icon.png"
$appIconDir = "E:\Master Mobile Apps\mobile-app-package\ios\App\App\Assets.xcassets\AppIcon.appiconset"
$splashDir = "E:\Master Mobile Apps\mobile-app-package\ios\App\App\Assets.xcassets\Splash.imageset"
$masterSplashPath = "E:\Master Mobile Apps\mobile-app-package\assets\splash.png"

if (-not (Test-Path $masterIconPath)) {
    Write-Error "Master icon not found at $masterIconPath"
    exit 1
}

$masterBmp = [System.Drawing.Bitmap]::FromFile($masterIconPath)

# Define all iOS icon variants
$variants = @(
    @{ name="AppIcon-20@1x.png"; size=20; idiom="ipad"; scale="1x" },
    @{ name="AppIcon-20@2x.png"; size=40; idiom="iphone"; scale="2x" },
    @{ name="AppIcon-20@2x-ipad.png"; size=40; idiom="ipad"; scale="2x" },
    @{ name="AppIcon-20@3x.png"; size=60; idiom="iphone"; scale="3x" },
    @{ name="AppIcon-29@1x.png"; size=29; idiom="ipad"; scale="1x" },
    @{ name="AppIcon-29@2x.png"; size=58; idiom="iphone"; scale="2x" },
    @{ name="AppIcon-29@2x-ipad.png"; size=58; idiom="ipad"; scale="2x" },
    @{ name="AppIcon-29@3x.png"; size=87; idiom="iphone"; scale="3x" },
    @{ name="AppIcon-40@1x.png"; size=40; idiom="ipad"; scale="1x" },
    @{ name="AppIcon-40@2x.png"; size=80; idiom="iphone"; scale="2x" },
    @{ name="AppIcon-40@2x-ipad.png"; size=80; idiom="ipad"; scale="2x" },
    @{ name="AppIcon-40@3x.png"; size=120; idiom="iphone"; scale="3x" },
    @{ name="AppIcon-60@2x.png"; size=120; idiom="iphone"; scale="2x" },
    @{ name="AppIcon-60@3x.png"; size=180; idiom="iphone"; scale="3x" },
    @{ name="AppIcon-76@1x.png"; size=76; idiom="ipad"; scale="1x" },
    @{ name="AppIcon-76@2x.png"; size=152; idiom="ipad"; scale="2x" },
    @{ name="AppIcon-83.5@2x.png"; size=167; idiom="ipad"; scale="2x" },
    @{ name="AppIcon-512@2x.png"; size=1024; idiom="universal"; scale="1x" }
)

Write-Host "Generating iOS AppIcon variants from master Star icon..."

foreach ($v in $variants) {
    $targetPath = Join-Path $appIconDir $v.name
    $resized = New-Object System.Drawing.Bitmap($v.size, $v.size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($masterBmp, 0, 0, $v.size, $v.size)
    $g.Dispose()

    $resized.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    Write-Host "  Generated: $($v.name) ($($v.size)x$($v.size))"
}

$masterBmp.Dispose()

# Update Contents.json with modern Xcode universal + full fallback catalog
$contentsJson = @'
{
  "images" : [
    {
      "filename" : "AppIcon-512@2x.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    },
    {
      "filename" : "AppIcon-20@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "AppIcon-20@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "filename" : "AppIcon-29@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "AppIcon-29@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "filename" : "AppIcon-40@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "AppIcon-40@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "filename" : "AppIcon-60@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "filename" : "AppIcon-60@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "filename" : "AppIcon-20@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20"
    },
    {
      "filename" : "AppIcon-20@2x-ipad.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "AppIcon-29@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29"
    },
    {
      "filename" : "AppIcon-29@2x-ipad.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "AppIcon-40@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40"
    },
    {
      "filename" : "AppIcon-40@2x-ipad.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "AppIcon-76@1x.png",
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "76x76"
    },
    {
      "filename" : "AppIcon-76@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76"
    },
    {
      "filename" : "AppIcon-83.5@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
'@

Set-Content -Path (Join-Path $appIconDir "Contents.json") -Value $contentsJson -Encoding UTF8
Write-Host "Updated AppIcon Contents.json successfully."

# Update Splash screens with solid white background centered brand logo
if (Test-Path $masterSplashPath) {
    Copy-Item $masterSplashPath (Join-Path $splashDir "splash-2732x2732.png") -Force
    Copy-Item $masterSplashPath (Join-Path $splashDir "splash-2732x2732-1.png") -Force
    Copy-Item $masterSplashPath (Join-Path $splashDir "splash-2732x2732-2.png") -Force
    Write-Host "Updated Splash imageset successfully."
}
