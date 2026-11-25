// e98's cross-check, as e97's: fdlibm's own results, by Java's StrictMath (fdlibm 5.3's by the Java specification),
// for the inputs e98_e2_fdlibm_more.js writes. java e98_e2_fdlibm_more_ref.java <dir>
// It reads <dir>/<f>.x, little-endian doubles, for f in expm1, tanh, asin, acos, cbrt, and writes <dir>/<f>.java.
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class e98_e2_fdlibm_more_ref {
  public static void main(String[] args) throws IOException {
    Path dir = Paths.get(args[0]);
    for (String f : new String[] {"expm1", "tanh", "asin", "acos", "cbrt"}) {
      byte[] b = Files.readAllBytes(dir.resolve(f + ".x"));
      ByteBuffer in = ByteBuffer.wrap(b).order(ByteOrder.LITTLE_ENDIAN);
      ByteBuffer out = ByteBuffer.allocate(b.length).order(ByteOrder.LITTLE_ENDIAN);
      for (int i = 0; i < b.length / 8; i++) {
        double x = in.getDouble(), y;
        switch (f) {
          case "expm1": y = StrictMath.expm1(x); break;
          case "tanh": y = StrictMath.tanh(x); break;
          case "asin": y = StrictMath.asin(x); break;
          case "acos": y = StrictMath.acos(x); break;
          default: y = StrictMath.cbrt(x); break;
        }
        out.putDouble(y);
      }
      Files.write(dir.resolve(f + ".java"), out.array());
    }
    System.out.println("E98REF_OK java " + System.getProperty("java.version"));
  }
}
