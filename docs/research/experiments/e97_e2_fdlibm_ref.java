// e97's cross-check: fdlibm's own results, for the inputs e97_e2_fdlibm_ports.js writes, by Java's StrictMath, whose
// results are fdlibm 5.3's by the Java specification. A plain single-file program: java e97_e2_fdlibm_ref.java <dir>
// It reads <dir>/<f>.x (exp, log, log10, tan) or <dir>/<f>.a and .b (atan2, pow, hypot), little-endian doubles, and
// writes <dir>/<f>.java, the same. Nothing else.
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class e97_e2_fdlibm_ref {
  static double[] read(Path p) throws IOException {
    byte[] b = Files.readAllBytes(p);
    ByteBuffer bb = ByteBuffer.wrap(b).order(ByteOrder.LITTLE_ENDIAN);
    double[] d = new double[b.length / 8];
    for (int i = 0; i < d.length; i++) d[i] = bb.getDouble();
    return d;
  }

  static void write(Path p, double[] d) throws IOException {
    ByteBuffer bb = ByteBuffer.allocate(d.length * 8).order(ByteOrder.LITTLE_ENDIAN);
    for (double v : d) bb.putDouble(v);
    Files.write(p, bb.array());
  }

  public static void main(String[] args) throws IOException {
    Path dir = Paths.get(args[0]);
    for (String f : new String[] {"exp", "log", "log10", "tan"}) {
      double[] x = read(dir.resolve(f + ".x")), y = new double[x.length];
      for (int i = 0; i < x.length; i++) {
        switch (f) {
          case "exp": y[i] = StrictMath.exp(x[i]); break;
          case "log": y[i] = StrictMath.log(x[i]); break;
          case "log10": y[i] = StrictMath.log10(x[i]); break;
          default: y[i] = StrictMath.tan(x[i]); break;
        }
      }
      write(dir.resolve(f + ".java"), y);
    }
    for (String f : new String[] {"atan2", "pow", "hypot"}) {
      double[] a = read(dir.resolve(f + ".a")), b = read(dir.resolve(f + ".b")), y = new double[a.length];
      for (int i = 0; i < a.length; i++) {
        switch (f) {
          case "atan2": y[i] = StrictMath.atan2(a[i], b[i]); break;
          case "pow": y[i] = StrictMath.pow(a[i], b[i]); break;
          default: y[i] = StrictMath.hypot(a[i], b[i]); break;
        }
      }
      write(dir.resolve(f + ".java"), y);
    }
    System.out.println("E97REF_OK java " + System.getProperty("java.version"));
  }
}
