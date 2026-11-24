package com.redcard.studio;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "CardExport")
public class CardExportPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name");
        String mimeType = call.getString("mimeType");
        String base64 = call.getString("base64");
        if (name == null || base64 == null || !("image/png".equals(mimeType) || "application/zip".equals(mimeType))) {
            call.reject("无效的导出文件");
            return;
        }

        Intent picker = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        picker.addCategory(Intent.CATEGORY_OPENABLE);
        picker.setType(mimeType);
        picker.putExtra(Intent.EXTRA_TITLE, name);
        try {
            startActivityForResult(call, picker, "saveResult");
        } catch (ActivityNotFoundException error) {
            call.reject("系统文件选择器不可用", error);
        }
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        Uri destination = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || destination == null) {
            call.resolve();
            return;
        }

        execute(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(destination)) {
                if (output == null) throw new IOException("无法打开保存位置");
                output.write(Base64.decode(call.getString("base64"), Base64.DEFAULT));
                output.flush();
            } catch (IOException | IllegalArgumentException | SecurityException error) {
                call.reject("写入导出文件失败", error);
                return;
            }
            call.resolve();
        });
    }
}
